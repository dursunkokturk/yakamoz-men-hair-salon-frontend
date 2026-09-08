// Musterinin Islemini Bitiren Personel Belirtilen Sure Icinde Sistem Uzerinden Onay Vermez Ise 
// Admin'e Bildirim Gonderiliyor

import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";

const NotificationContext = createContext(null);

export const NOTIFICATION_TYPES = {
  STAFF_APPROVAL_EXPIRED: "staff_approval_expired", // Personel süresi içinde onaylamadı
  STAFF_APPROVED: "staff_approved",                  // Personel onayladı (bilgilendirme amaçlı)
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() =>
    loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  function addNotification({ type, appointmentId, customerName, phone, amount, occurredAt }) {
    const entry = {
      id: `ntf-${Date.now()}`,
      type, appointmentId, customerName, phone, amount, occurredAt,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setNotifications((prev) => [entry, ...prev]);
    return entry;
  }

  function markAsRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications, NotificationProvider içinde kullanılmalı");
  return ctx;
}