// Yapilan Islemlerin Hepsine Tarih, Saat Ekleme Yapiliyor

import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { newId } from "../utils/crypto";

const AuditLogContext = createContext(null);
const MAX_LOGS = 2000;

export function AuditLogProvider({ children }) {
  const [logs, setLogs] = useState(() => loadFromStorage(STORAGE_KEYS.ACTION_LOGS, []));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTION_LOGS, logs);
  }, [logs]);

  /** Bölüm 7 & 19: kim, ne zaman, hangi kayıtta, ne işlem yaptı — tek giriş noktası. */
  function logAction({ actorId, actorRole, actorUsername, actionType, targetTable, targetId, summary }) {
    const entry = {
      id: newId("log"),
      actorId, actorRole, actorUsername, actionType, targetTable, targetId, summary,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [entry, ...prev].slice(0,MAX_LOGS));
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