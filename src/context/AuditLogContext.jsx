// Yapilan Islemlerin Hepsine Tarih, Saat Ekleme Yapiliyor

import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";

const AuditLogContext = createContext(null);

export function AuditLogProvider({ children }) {
  const [logs, setLogs] = useState(() => loadFromStorage(STORAGE_KEYS.ACTION_LOGS, []));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTION_LOGS, logs);
  }, [logs]);

  /** Bölüm 7 & 19: kim, ne zaman, hangi kayıtta, ne işlem yaptı — tek giriş noktası. */
  function logAction({ actorId, actorRole, actorUsername, actionType, targetTable, targetId, summary }) {
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId, actorRole, actorUsername, actionType, targetTable, targetId, summary,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [entry, ...prev]);
    return entry;
  }

  function getLogsByUser(actorId) {
    return logs.filter((l) => l.actorId === actorId);
  }

  return (
    <AuditLogContext.Provider value={{ logs, logAction, getLogsByUser }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error("useAuditLog, AuditLogProvider içinde kullanılmalı");
  return ctx;
}