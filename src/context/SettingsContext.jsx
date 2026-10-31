import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { useAuditLog } from "./AuditLogContext";
import { assertRole, ROLES } from "../utils/permissions";

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  businessName: "Yakamoz Erkek Kuaförü",
  phone: "0532 123 45 67",
  address: "Merkez Mahallesi, Berber Sokak No:1",
  workStartHour: 9,
  workEndHour: 19,
  closedWeekday: 1, // Salı — dayjs weekday(): 0=Pazartesi, 1=Salı
  maxAppointmentsPerSlotOverride: null, // null => normal (1), Admin bayramda 2 girebilir
};

/** closedWeekday'in Her Zaman 0-6 Arasi 
 * Gecerli Bir Tamsayi Olmasini Garanti Eder. */
function sanitizeClosedWeekday(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 6 ? n : DEFAULT_SETTINGS.closedWeekday;
}

const ALLOWED_SETTING_KEYS = ["businessName", "phone", "address", "closedWeekday", "maxAppointmentsPerSlotOverride"];

/** Depodan okunan ham veriyi doğrular: sadece bilinen alanlar, doğru tiplerle. */
function sanitizeSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const text = (v, fallback) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : fallback;
  return {
    ...DEFAULT_SETTINGS,
    businessName: text(s.businessName, DEFAULT_SETTINGS.businessName),
    phone: text(s.phone, DEFAULT_SETTINGS.phone),
    address: text(s.address, DEFAULT_SETTINGS.address),
    closedWeekday: sanitizeClosedWeekday(s.closedWeekday),
    maxAppointmentsPerSlotOverride: Number(s.maxAppointmentsPerSlotOverride) === 2 ? 2 : null,
  };
}

/**
 * v1 Anahtarinda (yakamoz_settings) Kayitli Eski Veriyi Okur. 
 * O Surumde closedWeekday Varsayilani Hatali Olarak 2 (Carsamba) idi Ama Yorum
 * "Salı" Yaziyordu — Bu Yuzden 2 Degeri Kesin Olarak Hatali Kabul Edilip
 * Dogru Varsayilana (1 = Sali) Cevrilir. 
 * Diger Alanlar (işletme adı, telefon, adres vb.) korunur.
 */
function migrateLegacySettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS_LEGACY);
    if (!raw) return null;
    const legacy = JSON.parse(raw);
    const correctedClosedWeekday =
      legacy.closedWeekday === 2 ? 1 : sanitizeClosedWeekday(legacy.closedWeekday);
    return { ...legacy, closedWeekday: correctedClosedWeekday };
  } catch {
    return null;
  }
}

export function SettingsProvider({ children }) {
  const { logAction } = useAuditLog();

  const [settings, setSettings] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.SETTINGS, null);
    if (stored) return sanitizeSettings(stored);
    // Yeni anahtar boşsa eski (v1) anahtarı göç ettir; her durumda doğrulanır.
    return sanitizeSettings(migrateLegacySettings());
  });

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  const updateSettings = useCallback((updates, actor) => {
    function updateSettings(updates, actor) {
      assertRole(actor, ROLES.ADMIN);

      // Sadece izin verilen alanlar ve doğrulanmış değerler
      const clean = {};

      for (const key of ALLOWED_SETTING_KEYS) {
        if (key in updates) clean[key] = updates[key];
      }
      if ("closedWeekday" in clean) clean.closedWeekday = sanitizeClosedWeekday(clean.closedWeekday);
      if ("maxAppointmentsPerSlotOverride" in clean) {
        clean.maxAppointmentsPerSlotOverride = Number(clean.maxAppointmentsPerSlotOverride) === 2 ? 2 : null;
      }
      for (const key of ["businessName", "phone", "address"]) {
        if (key in clean) clean[key] = String(clean[key]).trim().slice(0, 120);
      }

      setSettings((prev) => ({ ...prev, ...clean }));
      logAction({
        actorId: actor.id, actorRole: actor.role, actorUsername: actor.username,
        actionType: "UPDATE_SETTINGS", targetTable: "settings", targetId: "settings",
        summary: `Ayarlar güncellendi: ${Object.keys(clean).join(", ")}`,
      });
    }
  }, [logAction]);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings, SettingsProvider içinde kullanılmalı");
  return ctx;
}