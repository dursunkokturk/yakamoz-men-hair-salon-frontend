import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { useAuditLog } from "./AuditLogContext";
import { assertRole, ROLES } from "../utils/permissions";
import { newId } from "../utils/crypto";

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
    assertRole(actor, ROLES.ADMIN);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_DATE");
    if (closedDays.some((d) => d.date === date)) {
      throw new Error("ALREADY_CLOSED");
    }

    const entry = { id: newId("cd"), date, reason: String(reason).trim().slice(0, 80) };
    setClosedDays((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));

    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "ADD_CLOSED_DAY", targetTable: "closedDays", targetId: entry.id,
      summary: `Kapalı gün eklendi: ${date} (${entry.reason || "Belirtilmedi"})`,
    });

    return entry;
  }

  function removeClosedDay(id, actor) {
    assertRole(actor, ROLES.ADMIN);
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