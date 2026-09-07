// Basit localStorage sarmalayıcı — tüm veri kalıcılığı bu dosya üzerinden yürür.

export function loadFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`storage: "${key}" okunamadı`, err);
    return fallback;
  }
}

export function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`storage: "${key}" kaydedilemedi`, err);
  }
}

export const STORAGE_KEYS = {
  APPOINTMENTS: "yakamoz_appointments",
  SERVICES: "yakamoz_services",
  BLOCKED_CUSTOMERS: "yakamoz_blocked_customers",
  AUTH_TOKEN: "yakamoz_auth_token",
  USERS: "yakamoz_users", // Admin + Personel hesapları (role: "admin" | "staff")
  USERS_LEGACY_CREDENTIALS: "yakamoz_admin_credentials", // v1 tekli admin kaydı — yalnızca migration için okunur  SETTINGS: "yakamoz_settings_v2", // v2: closedWeekday varsayılanındaki hata (2=Çarşamba) düzeltildi
  SETTINGS_LEGACY: "yakamoz_settings", // v1 anahtarı — sadece göç (migration) için okunur
  CLOSED_DAYS: "yakamoz_closed_days",
  THEME: "yakamoz_theme",
  ADMIN_FILTERS: "yakamoz_admin_filters",
  NOTIFICATIONS: "yakamoz_notifications", // Personel Onay Bildirimleri
  ACTION_LOGS: "yakamoz_action_logs",     // audit log (kim, ne zaman, ne yaptı)
};