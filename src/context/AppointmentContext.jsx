import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { DEFAULT_MAX_APPOINTMENTS_PER_SLOT } from "../utils/dateUtils";
import { getDateClosureInfo } from "../utils/scheduling";
import { useClosedDays } from "./ClosedDayContext";
import { useSettings } from "./SettingsContext";
import { useAuditLog } from "./AuditLogContext";
import { useNotifications, NOTIFICATION_TYPES } from "./NotificationContext";

const AppointmentContext = createContext(null);

export const APPOINTMENT_STATUS = {
  PENDING: "pending", // Bekliyor
  APPROVED: "approved", // Onaylandı
  COMPLETED: "completed", // Tamamlandı
  CANCELLED: "cancelled", // İptal
};

// Personel onay alanı — randevu durumundan (status) bağımsız ayrı bir alan.
export const STAFF_APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  EXPIRED: "expired", // Süresi Geçti (Admin'e Bildirildi)
};

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState(() =>
    loadFromStorage(STORAGE_KEYS.APPOINTMENTS, [])
  );

  // isDateBookable'ın Ihtiyac Duydugu Bagimliliklar
  const { isDateClosed, getClosedDayInfo } = useClosedDays();
  const { settings } = useSettings();
  const { logAction } = useAuditLog();
  const { addNotification } = useNotifications();

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);
  }, [appointments]);

  /** Normalde 1, bayram/istisna dönemlerinde Admin panelden ayarlanan azami 2. */
  function getSlotCapacity() {
    const override = Number(settings.maxAppointmentsPerSlotOverride);
    if (Number.isInteger(override) && override > 0) {
      return Math.min(override, 2);
    }
    return DEFAULT_MAX_APPOINTMENTS_PER_SLOT;
  }

  /** Belirli tarih+saatte, iptal edilmemiş kaç randevu var. */
  function countActiveAppointmentsAt(date, time, excludeId = null) {
    return appointments.filter(
      (a) =>
        a.date === date &&
        a.time === time &&
        a.status !== APPOINTMENT_STATUS.CANCELLED &&
        a.id !== excludeId
    ).length;
  }

  function isSlotFull(date, time, excludeId = null) {
    return countActiveAppointmentsAt(date, time, excludeId) >= getSlotCapacity();
  }

  /* Tarih Kapali Mi? 
    Hem haftalık kapalı gün 
    hem admin tarafından eklenen özel günler dahil. */
  function isDateBookable(date) {
    const { isClosed } = getDateClosureInfo(date, {
      closedWeekday: settings.closedWeekday,
      isDateClosed,
      getClosedDayInfo,
    });
    return !isClosed;
  }

  function createAppointment(data) {

    // Kapali Gun Kontrolu Artik Burada Uygulaniyor
    if (!isDateBookable(data.date)) {
      throw new Error("DATE_CLOSED");
    }
    if (isSlotFull(data.date, data.time)) {
      throw new Error("SLOT_FULL");
    }
    const appointment = {
      id: `apt-${Date.now()}`,
      status: APPOINTMENT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      ...data,
    };
    setAppointments((prev) => [...prev, appointment]);
    return appointment;
  }

  function approveAppointment(id) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: APPOINTMENT_STATUS.APPROVED } : a))
    );
    logAction({
      actionType: "APPROVE_APPOINTMENT", targetTable: "appointments", targetId: id,
      summary: "Randevu admin tarafından onaylandı"
    });
  }

  function completeAppointment(id, actor) {
    const completedAt = new Date().toISOString();
    setAppointments((prev) =>
      prev.map((a) => (
        a.id === id
          ? {
            ...a,
            status: APPOINTMENT_STATUS.COMPLETED,
            completedAt,
            STAFF_APPROVAL_STATUS: STAFF_APPROVAL_STATUS.PENDING,
            staffApprovedBy: null,
            staffApprovedAt: null,
          }
          : a))
    );
    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "COMPLETE_APPOINTMENT", targetTable: "appointments", targetId: id,
      summary: "Randevu tamamlandı olarak işaretlendi, personel onayı bekleniyor",
    });
  }

  /** Bölüm 9.1: Personel, tamamlanan işlemi ve ücreti onaylar. */
  function approveStaffWork(id, staffUser) {
    const approvedAt = new Date().toISOString();
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
            ...a, staffApprovalStatus: STAFF_APPROVAL_STATUS.APPROVED,
            staffApprovedBy: staffUser.username, staffApprovedAt: approvedAt
          }
          : a
      )
    );
    logAction({
      actorId: staffUser.id, actorRole: staffUser.role, actorUsername: staffUser.username,
      actionType: "STAFF_APPROVE", targetTable: "appointments", targetId: id,
      summary: "Personel, tamamlanan işlemi ve ücreti onayladı",
    });
  }

  /**
   * Backend/cron olmadığı için süresi geçen onaylar istemci tarafında taranır.
   * useApprovalWatcher hook'u tarafından hem periyodik hem de panel açılışında (mount) çağrılır.
   */
  function checkExpiredStaffApprovals(thresholdHours) {
    const now = Date.now();
    const thresholdMs = (Number(thresholdHours) || 4) * 60 * 60 * 1000;
    setAppointments((prev) =>
      prev.map((a) => {
        const isExpirable =
          a.staffApprovalStatus === STAFF_APPROVAL_STATUS.PENDING &&
          a.completedAt &&
          now - new Date(a.completedAt).getTime() > thresholdMs;
        if (!isExpirable) return a;
        addNotification({
          type: NOTIFICATION_TYPES.STAFF_APPROVAL_EXPIRED,
          appointmentId: a.id, customerName: a.fullName, phone: a.phone,
          amount: a.price, occurredAt: a.completedAt,
        });
        return { ...a, staffApprovalStatus: STAFF_APPROVAL_STATUS.EXPIRED };
      })
    );
  }

  function cancelAppointment(id) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: APPOINTMENT_STATUS.CANCELLED } : a))
    );
  }

  function deleteAppointment(id) {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  function rescheduleAppointment(id, newDate, newTime) {
    if (!isDateBookable(newDate)) {
      throw new Error("DATE_CLOSED");
    }

    if (isSlotFull(newDate, newTime, id)) {
      throw new Error("SLOT_FULL");
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, date: newDate, time: newTime } : a))
    );
  }

  function getAppointmentsByDate(date) {
    return appointments
      .filter((a) => a.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        createAppointment,
        approveAppointment,
        completeAppointment,
        approveStaffWork,
        checkExpiredStaffApprovals,
        cancelAppointment,
        deleteAppointment,
        rescheduleAppointment,
        getAppointmentsByDate,
        countActiveAppointmentsAt,
        isSlotFull,
        isDateBookable,
        getSlotCapacity,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error("useAppointments, AppointmentProvider içinde kullanılmalı");
  return ctx;
}
