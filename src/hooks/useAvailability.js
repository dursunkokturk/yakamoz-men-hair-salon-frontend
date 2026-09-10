import { useMemo } from "react";
import { useAppointments } from "../context/AppointmentContext";
import { useClosedDays } from "../context/ClosedDayContext";
import { useSettings } from "../context/SettingsContext";
import { getDateClosureInfo } from "../utils/scheduling";
import { generateTimeSlots, isPastDateTime } from "../utils/dateUtils";

/**
 * Verilen tarih için tüm saat dilimlerini, her birinin dolu/boş durumuyla birlikte döner.
 * Salı günleri ve geçmiş saatler otomatik olarak pasif sayılır.
 */
export function useAvailability(dateISO) {
  const { countActiveAppointmentsAt, getSlotCapacity } = useAppointments();
  const { isDateClosed, getClosedDayInfo } = useClosedDays();
  const { settings } = useSettings();

  return useMemo(() => {
    if (!dateISO) return { isOpen: false, slots: [], closedReason: null };

    const { isClosed, reason } = getDateClosureInfo(dateISO, {
      closedWeekday: settings.closedWeekday, isDateClosed, getClosedDayInfo,
    });

    if (isClosed) {
      return { isOpen: false, slots: [], closedReason: reason };
    }

    const capacity = getSlotCapacity();
    const slots = generateTimeSlots().map((time) => {
      const takenCount = countActiveAppointmentsAt(dateISO, time);
      const isPast = isPastDateTime(dateISO, time);
      return {
        time,
        takenCount,
        remaining: Math.max(0, capacity - takenCount),
        isFull: takenCount >= capacity,
        isPast,
        isDisabled: takenCount >= capacity || isPast,
      };
    });
    return { isOpen: true, slots, closedReason: null };
  }, [dateISO, countActiveAppointmentsAt, isDateClosed, getClosedDayInfo, settings.closedWeekday]);
}
