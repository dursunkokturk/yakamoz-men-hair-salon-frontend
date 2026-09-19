// Yapilan Islemlerde Gerceklesen Degisiklikleri 
// Belirtilen Zaman Araliklarinda Takip Etme

import { useEffect } from "react";
import { useAppointments } from "../context/AppointmentContext";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Her 5 dakikada bir

export function useApprovalWatcher() {
  const { checkExpiredStaffApprovals } = useAppointments();

  useEffect(() => {
    // Mount anında bir kez (panel her açıldığında) kontrol
    checkExpiredStaffApprovals();
    const interval = setInterval(() => {
      checkExpiredStaffApprovals();
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}