// Yapilan Islemlerde Gerceklesen Degisiklikleri 
// Belirtilen Zaman Araliklarinda Takip Etme

import { useEffect } from "react";
import { useAppointments } from "../context/AppointmentContext";
import { useSettings } from "../context/SettingsContext";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Her 5 dakikada bir

export function useApprovalWatcher() {
  const { checkExpiredStaffApprovals } = useAppointments();
  const { settings } = useSettings();

  useEffect(() => {
    // Mount anında bir kez (panel her açıldığında) kontrol
    checkExpiredStaffApprovals(settings.staffApprovalTimeoutHours);
    const interval = setInterval(() => {
      checkExpiredStaffApprovals(settings.staffApprovalTimeoutHours);
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.staffApprovalTimeoutHours]);
}