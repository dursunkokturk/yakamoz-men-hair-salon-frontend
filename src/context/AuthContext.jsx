import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { useAuditLog } from "./AuditLogContext";

const AuthContext = createContext(null);

// Backend olmadığı için gerçek bir kimlik sunucusu yok. Bu, demo/portfolyo amaçlı
// istemci tarafında üretilen, base64 ile kodlanmış sahte bir JWT'dir. Gerçek bir
// üründe bu doğrulama mutlaka bir backend servisi tarafından yapılmalıdır.
export const ROLES = { ADMIN: "admin", STAFF: "staff" };

const DEFAULT_ADMIN_USER = {
  id: "usr-admin",
  username: "admin",
  password: "yakamoz2026",
  fullName: "Admin",
  role: ROLES.ADMIN,
  isActive: true,
  createdAt: new Date(0).toISOString(),
};

const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 saat

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

function createFakeToken(user) {
  const header = base64urlEncode({ alg: "none", typ: "JWT" });
  const payload = base64urlEncode({
    sub: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
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
  if (!payload || payload.exp < Date.now()) return null;
  return payload;
}

/** v1 tekli admin kaydını (yakamoz_admin_credentials) yeni yk_users listesine taşır (Bölüm 25 migration mantığı). */
function migrateLegacyCredentials() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.USERS_LEGACY_CREDENTIALS);
    if (!raw) return null;
    const legacy = JSON.parse(raw);
    return {
      ...DEFAULT_ADMIN_USER,
      username: legacy.username || DEFAULT_ADMIN_USER.username,
      password: legacy.password || DEFAULT_ADMIN_USER.password,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {

  const { logAction } = useAuditLog();

  const [users, setUsers] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.USERS, null);
    if (stored && stored.length > 0) return stored;
    return [migrateLegacyCredentials() ?? DEFAULT_ADMIN_USER];
  });

  const [token, setToken] = useState(() => loadFromStorage(STORAGE_KEYS.AUTH_TOKEN, null));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USERS, users);
  }, [users]);

  const payload = decodeToken(token);
  const isAuthenticated = Boolean(payload);

  const currentUser = payload
    ? { id: payload.sub, username: payload.username, role: payload.role, fullName: payload.fullName }
    : null;

  function login(username, password) {
    const user = users.find(
      (u) => u.username === username && u.password === password && u.isActive !== false
    );
    if (!user) throw new Error("INVALID_CREDENTIALS");
    const newToken = createFakeToken(user);
    setToken(newToken);
    saveToStorage(STORAGE_KEYS.AUTH_TOKEN, newToken);
    logAction({
      actorId: user.id, actorRole: user.role, actorUsername: user.username,
      actionType: "LOGIN", targetTable: "users", targetId: user.id,
      summary: `${user.role === ROLES.ADMIN ? "Admin" : "Personel"} girişi yapıldı`,
    });
    return user;
  }

  function logout() {
    setToken(null);
    saveToStorage(STORAGE_KEYS.AUTH_TOKEN, null);
  }

  /** Mevcut Sifreyi Dogrulayip Yeni Sifreyi Kaydeder. */
  function changePassword(currentPassword, newPassword) {
    const user = users.find((u) => u.id === currentUser?.id);
    if (!user || currentPassword !== user.password) {
      throw new Error("WRONG_CURRENT_PASSWORD");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("WEAK_PASSWORD");
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u)));
  }

  // --- Personel Yönetimi (Bölüm 9) — yalnızca Admin panelinden çağrılmalı ---
  function addStaffUser({ username, password, fullName }) {
    if (users.some((u) => u.username === username)) throw new Error("USERNAME_TAKEN");
    const newUser = {
      id: `usr-${Date.now()}`, username, password, fullName,
      role: ROLES.STAFF, isActive: true, createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    logAction({
      actorId: currentUser?.id, actorRole: currentUser?.role, actorUsername: currentUser?.username,
      actionType: "CREATE_STAFF", targetTable: "users", targetId: newUser.id,
      summary: `Personel hesabı oluşturuldu: ${username}`,
    });
    return newUser;
  }

  function updateStaffUser(id, updates) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  }

  function deleteStaffUser(id, { alsoDeleteHistory = false } = {}) {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAction({
      actorId: currentUser?.id, actorRole: currentUser?.role, actorUsername: currentUser?.username,
      actionType: "DELETE_STAFF", targetTable: "users", targetId: id,
      summary: `Personel kaydı silindi: ${target?.username ?? id}${alsoDeleteHistory ? " (geçmiş kayıtlarla birlikte)" : ""}`,
    });
  }

  const staffUsers = users.filter((u) => u.role === ROLES.STAFF);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        currentUser, 
        role: currentUser?.role ?? null, 
        login, 
        logout, 
        changePassword, 
        users, 
        staffUsers, 
        addStaffUser, 
        updateStaffUser, 
        deleteStaffUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}
