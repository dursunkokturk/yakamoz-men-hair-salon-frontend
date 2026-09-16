import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { useAuditLog } from "./AuditLogContext";

const ClosedDayContext = createContext(null);

export function ClosedDayProvider({ children }) {
  const { logAction } = useAuditLog();
  const [closedDays, setClosedDays] = useState(() =>
    loadFromStorage(STORAGE_KEYS.CLOSED_DAYS, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CLOSED_DAYS, closedDays);
  }, [closedDays]);

  function addClosedDay(date, reason = "", actor) {
    if (closedDays.some((d) => d.date === date)) {
      throw new Error("ALREADY_CLOSED");
    }

    const entry = { id: `cd-${Date.now()}`, date, reason: reason.trim() };
    setClosedDays((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));

    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "ADD_CLOSED_DAY", targetTable: "closedDays", targetId: entry.id,
      summary: `Kapalı gün eklendi: ${date} (${entry.reason || "Belirtilmedi"})`,
    });

    return entry;
  }

  function removeClosedDay(id, actor) {
    const target = closedDays.find((d) => d.id === id);
    setClosedDays((prev) => prev.filter((d) => d.id !== id));

    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "REMOVE_CLOSED_DAY", targetTable: "closedDays", targetId: id,
      summary: `Kapalı gün kaldırıldı: ${target?.date ?? id}`,
    });

  }

  function isDateClosed(dateISO) {
    return closedDays.some((d) => d.date === dateISO);
  }

  function getClosedDayInfo(dateISO) {
    return closedDays.find((d) => d.date === dateISO) || null;
  }

  return (
    <ClosedDayContext.Provider
      value={{ closedDays, addClosedDay, removeClosedDay, isDateClosed, getClosedDayInfo }}
    >
      {children}
    </ClosedDayContext.Provider>
  );
}

export function useClosedDays() {
  const ctx = useContext(ClosedDayContext);
  if (!ctx) throw new Error("useClosedDays, ClosedDayProvider içinde kullanılmalı");
  return ctx;
}