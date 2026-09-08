import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  businessName: "Yakamoz Erkek Kuaförü",
  phone: "0532 123 45 67",
  address: "Merkez Mahallesi, Berber Sokak No:1",
  workStartHour: 9,
  workEndHour: 19,
  closedWeekday: 1, // Salı — dayjs weekday(): 0=Pazartesi, 1=Salı
  staffApprovalTimeoutHours: 4, // Personelin onay için süresi
  maxAppointmentsPerSlotOverride: null, // null => normal (1), Admin bayramda 2 girebilir
};

/** closedWeekday'in Her Zaman 0-6 Arasi 
 * Gecerli Bir Tamsayi Olmasini Garanti Eder. */
function sanitizeClosedWeekday(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 6 ? n : DEFAULT_SETTINGS.closedWeekday;
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
    return { ...DEFAULT_SETTINGS, ...legacy, closedWeekday: correctedClosedWeekday };
  } catch {
    return null;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.SETTINGS, null);
    if (stored) {
      // Yeni (v2) anahtarda veri varsa, yine de closedWeekday'i doğrula —
      // bozuk/aralık dışı bir değer varsayılana döner.
      return { ...DEFAULT_SETTINGS, ...stored, closedWeekday: sanitizeClosedWeekday(stored.closedWeekday) };
    }
    // Yeni anahtar boşsa, eski (v1) anahtarı göç ettir. O da yoksa temiz varsayılan kullanılır.
    return migrateLegacySettings() ?? DEFAULT_SETTINGS;
  });

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  function updateSettings(updates) {
    setSettings((prev) => ({ ...prev, ...updates }));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings, SettingsProvider içinde kullanılmalı");
  return ctx;
}
