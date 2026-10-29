import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { useAuditLog } from "./AuditLogContext";
import { ROLES, assertRole } from "../utils/permissions";
import { generateSalt, hashPassword, safeEqual, newId } from "../utils/crypto";

const AuthContext = createContext(null);

// Backend olmadığı için gerçek bir kimlik sunucusu yok. Bu, demo/portfolyo amaçlı
// istemci tarafında üretilen sahte bir token'dır. Gerçek bir üründe doğrulama
// mutlaka bir backend servisi tarafından yapılmalıdır.
export { ROLES };

const DEFAULT_ADMIN_USER = {
  id: "usr-admin",
  username: "admin",
  salt: null,
  passwordHash: null, // ilk kurulumda belirlenir
  fullName: "Admin",
  role: ROLES.ADMIN,
  isActive: true,
  createdAt: new Date(0).toISOString(),
};

const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 saat
const MIN_PASSWORD_LENGTH = 10;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const DUMMY_SALT = "AAAAAAAAAAAAAAAAAAAAAA==";
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

function base64urlEncode(obj) {
  return btoa(JSON.stringify(obj)).replace(/=/g, "");
}

function base64urlDecode(str) {
  try {
    return JSON.parse(atob(str));
  } catch {
    return null;
  }
}

// Token'a rol / isim KONMUYOR: sadece kimlik (sub) ve süre.
function createFakeToken(user) {
  const header = base64urlEncode({ alg: "none", typ: "JWT" });
  const payload = base64urlEncode({
    sub: user.id,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  });
  return `${header}.${payload}.demo-signature`;
}

function decodeToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = base64urlDecode(parts[1]);
  if (!payload || typeof payload.sub !== "string" || payload.exp < Date.now()) return null;
  return payload;
}

/** v1 tekli admin kaydını yeni users listesine taşır. Düz metin şifre TAŞINMAZ. */
function migrateLegacyCredentials() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.USERS_LEGACY_CREDENTIALS);
    if (!raw) return null;
    const legacy = JSON.parse(raw);
    window.localStorage.removeItem(STORAGE_KEYS.USERS_LEGACY_CREDENTIALS);
    return { ...DEFAULT_ADMIN_USER, username: legacy.username || DEFAULT_ADMIN_USER.username };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const { logAction } = useAuditLog();

  const [users, setUsers] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.USERS, null);
    const valid = Array.isArray(stored)
      ? stored.filter((u) => u && typeof u.id === "string" && typeof u.username === "string" && typeof u.role === "string")
      : [];
    if (valid.some((u) => u.role === ROLES.ADMIN)) return valid;
    if (valid.length > 0) return [DEFAULT_ADMIN_USER, ...valid];
    return [migrateLegacyCredentials() ?? DEFAULT_ADMIN_USER];
  });

  // Token sessionStorage'da (sekme kapanınca silinir)
  const [token, setToken] = useState(() => window.sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USERS, users);
  }, [users]);

  // Tek seferlik temizlik: eski sürümden kalan düz şifreler.
  // - Personel: şifre hash'lenir, düz şifre silinir.
  // - Admin: eski varsayılan şifre kodda herkese açıktı, bu yüzden TAŞINMAZ; ilk kurulum yeniden istenir.
  useEffect(() => {
    window.localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);

    const legacyUsers = users.filter((u) => typeof u.password === "string");
    if (legacyUsers.length === 0) return;

    let cancelled = false;
    (async () => {
      const migrated = await Promise.all(
        legacyUsers.map(async (u) => {
          if (u.role === ROLES.ADMIN) return { id: u.id, salt: null, passwordHash: null };
          const salt = generateSalt();
          return { id: u.id, salt, passwordHash: await hashPassword(u.password, salt) };
        })
      );
      if (cancelled) return;
      setUsers((prev) =>
        prev.map((u) => {
          const m = migrated.find((x) => x.id === u.id);
          if (!m) return u;
          const { password: _removed, ...rest } = u;
          return { ...rest, salt: m.salt, passwordHash: m.passwordHash };
        })
      );
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rol TOKEN'dan değil, kullanıcı kaydından okunur.
  const payload = decodeToken(token);
  const account = payload ? users.find((u) => u.id === payload.sub && u.isActive !== false) : null;
  const isAuthenticated = Boolean(account);
  const currentUser = account
    ? { id: account.id, username: account.username, role: account.role, fullName: account.fullName }
    : null;

  const needsSetup = users.some((u) => u.role === ROLES.ADMIN && !u.passwordHash);

  async function setupAdminPassword(password) {
    if (!needsSetup) throw new Error("ALREADY_SETUP");
    if (!password || password.length < MIN_PASSWORD_LENGTH) throw new Error("WEAK_PASSWORD");
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    setUsers((prev) =>
      prev.map((u) => (u.role === ROLES.ADMIN && !u.passwordHash ? { ...u, salt, passwordHash } : u))
    );
    logAction({
      actorUsername: "admin", actionType: "ADMIN_SETUP",
      targetTable: "users", targetId: "usr-admin", summary: "Admin şifresi ilk kez belirlendi",
    });
  }

  async function login(username, password) {
    if (typeof password !== "string" || password.length > 128) throw new Error("INVALID_CREDENTIALS");
    const name = String(username ?? "").trim().toLowerCase().slice(0, 30);
    const attemptKey = `u:${name}`; // "__proto__" gibi anahtarlar sorun çıkarmasın
    const attempts = loadFromStorage(STORAGE_KEYS.LOGIN_ATTEMPTS, {});
    const rec = attempts[attemptKey] ?? { count: 0, lockedUntil: 0 };
    if (rec.lockedUntil > Date.now()) throw new Error("ACCOUNT_LOCKED");

    // Şifre burada KONTROL EDİLMEZ; sadece kullanıcı aranır
    const user = users.find((u) => u.username.toLowerCase() === name && u.isActive !== false);

    // Kullanıcı olmasa bile hash hesaplanır (yanıt süresinden kullanıcı varlığı anlaşılmasın)
    const hash = await hashPassword(password, user?.salt ?? DUMMY_SALT);
    const ok = Boolean(user?.passwordHash) && safeEqual(hash, user.passwordHash);

    if (!ok) {
      const count = rec.count + 1;
      attempts[attemptKey] = { count, lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0 };
      saveToStorage(STORAGE_KEYS.LOGIN_ATTEMPTS, attempts);
      logAction({
        actorUsername: name.slice(0, 30), actionType: "LOGIN_FAILED",
        targetTable: "users", targetId: user?.id ?? "unknown", summary: "Başarısız giriş denemesi",
      });
      throw new Error("INVALID_CREDENTIALS");
    }

    delete attempts[attemptKey];
    saveToStorage(STORAGE_KEYS.LOGIN_ATTEMPTS, attempts);

    const newToken = createFakeToken(user);
    setToken(newToken);
    window.sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
    logAction({
      actorId: user.id, actorRole: user.role, actorUsername: user.username,
      actionType: "LOGIN", targetTable: "users", targetId: user.id,
      summary: `${user.role === ROLES.ADMIN ? "Admin" : "Personel"} girişi yapıldı`,
    });
    return { id: user.id, username: user.username, role: user.role, fullName: user.fullName };
  }

  function logout() {
    if (currentUser) {
      logAction({
        actorId: currentUser.id, actorRole: currentUser.role, actorUsername: currentUser.username,
        actionType: "LOGOUT", targetTable: "users", targetId: currentUser.id, summary: "Çıkış yapıldı",
      });
    }
    setToken(null);
    window.sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async function changePassword(currentPassword, newPassword) {
    const user = users.find((u) => u.id === currentUser?.id);
    if (!user || !user.passwordHash) throw new Error("WRONG_CURRENT_PASSWORD");
    const currentHash = await hashPassword(currentPassword, user.salt);
    if (!safeEqual(currentHash, user.passwordHash)) throw new Error("WRONG_CURRENT_PASSWORD");
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH || newPassword === currentPassword) {
      throw new Error("WEAK_PASSWORD");
    }
    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    // DÜZ şifre değil, salt + hash kaydedilir
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, salt, passwordHash } : u)));
    logAction({
      actorId: user.id, actorRole: user.role, actorUsername: user.username,
      actionType: "CHANGE_PASSWORD", targetTable: "users", targetId: user.id, summary: "Şifre değiştirildi",
    });
  }

  // --- Personel Yönetimi: yalnızca Admin ---
  async function addStaffUser({ username, password, fullName }) {
    assertRole(currentUser, ROLES.ADMIN);
    const cleanUsername = String(username ?? "").trim().toLowerCase();
    const cleanFullName = String(fullName ?? "").trim().slice(0, 60);
    if (!USERNAME_REGEX.test(cleanUsername) || !cleanFullName) throw new Error("INVALID_INPUT");
    if (!password || password.length < MIN_PASSWORD_LENGTH) throw new Error("WEAK_PASSWORD");
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) throw new Error("USERNAME_TAKEN");

    const salt = generateSalt();
    const newUser = {
      id: newId("usr"), username: cleanUsername, fullName: cleanFullName,
      salt, passwordHash: await hashPassword(password, salt),
      role: ROLES.STAFF, isActive: true, createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    logAction({
      actorId: currentUser.id, actorRole: currentUser.role, actorUsername: currentUser.username,
      actionType: "CREATE_STAFF", targetTable: "users", targetId: newUser.id,
      summary: `Personel hesabı oluşturuldu: ${cleanUsername}`,
    });
  }

  // Sadece isActive değişebilir. { role: "admin" } gibi alanlar YOK SAYILIR.
  function updateStaffUser(id, { isActive }) {
    assertRole(currentUser, ROLES.ADMIN);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id && u.role === ROLES.STAFF ? { ...u, isActive: Boolean(isActive) } : u
      )
    );
    logAction({
      actorId: currentUser.id, actorRole: currentUser.role, actorUsername: currentUser.username,
      actionType: "UPDATE_STAFF", targetTable: "users", targetId: id,
      summary: `Personel ${isActive ? "aktif" : "pasif"} yapıldı`,
    });
  }

  function deleteStaffUser(id, { alsoDeleteHistory = false } = {}) {
    assertRole(currentUser, ROLES.ADMIN);
    const target = users.find((u) => u.id === id);
    if (!target || target.role !== ROLES.STAFF) throw new Error("FORBIDDEN"); // admin silinemez
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAction({
      actorId: currentUser.id, actorRole: currentUser.role, actorUsername: currentUser.username,
      actionType: "DELETE_STAFF", targetTable: "users", targetId: id,
      summary: `Personel kaydı silindi: ${target.username}${alsoDeleteHistory ? " (geçmiş kayıtlarla birlikte)" : ""}`,
    });
  }

  // Hash/salt bilgisi bileşenlere HİÇ verilmez
  const staffUsers = users
    .filter((u) => u.role === ROLES.STAFF)
    .map(({ salt: _s, passwordHash: _h, password: _p, ...safe }) => safe);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        role: currentUser?.role ?? null,
        needsSetup,
        setupAdminPassword,
        login,
        logout,
        changePassword,
        staffUsers,
        addStaffUser,
        updateStaffUser,
        deleteStaffUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}