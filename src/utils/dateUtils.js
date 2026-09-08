import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import weekday from "dayjs/plugin/weekday";
import "dayjs/locale/tr";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekday);
dayjs.locale("tr");

export const WORK_START_HOUR = 9;
export const WORK_END_HOUR = 19;
export const CLOSED_WEEKDAY = 1; // dayjs.weekday() — tr locale'de hafta Pazartesi (0) ile başlar, Salı = 1
export const SLOT_INTERVAL_MINUTES = 30;
export const DEFAULT_MAX_APPOINTMENTS_PER_SLOT = 1; // Normal günlerde 1 kişi
export const BAYRAM_MAX_APPOINTMENTS_PER_SLOT = 2;   // Kurban/Ramazan istisnası, azami 2

// dayjs.weekday(): tr locale'de hafta Pazartesi (0) ile başlar
export const WEEKDAY_LABELS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

/** Belirli bir tarihin salon için çalışma günü olup olmadığını döner (Salı kapalı). */
export function isWorkingDay(date, closedWeekday = CLOSED_WEEKDAY) {
  const d = dayjs(date);
  return d.weekday() !== closedWeekday;
}

/** 09:00–19:00 arası, 30 dakikalık aralıklarla saat listesi üretir (19:00 kapanış olduğu için son randevu 18:30'dur). */
export function generateTimeSlots() {
  const slots = [];
  let current = dayjs().hour(WORK_START_HOUR).minute(0).second(0);
  const closing = dayjs().hour(WORK_END_HOUR).minute(0).second(0);
  while (current.isBefore(closing)) {
    slots.push(current.format("HH:mm"));
    current = current.add(SLOT_INTERVAL_MINUTES, "minute");
  }
  return slots;
}

export function formatDateTR(date) {
  return dayjs(date).format("DD MMMM YYYY, dddd");
}

export function formatDateShort(date) {
  return dayjs(date).format("DD.MM.YYYY");
}

export function todayISO() {
  return dayjs().format("YYYY-MM-DD");
}

export function isPastDateTime(dateISO, time) {
  const dt = dayjs(`${dateISO} ${time}`, "YYYY-MM-DD HH:mm");
  return dt.isBefore(dayjs());
}

export { dayjs };
