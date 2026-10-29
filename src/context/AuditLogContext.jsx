// Yapilan Islemlerin Hepsine Tarih, Saat Ekleme Yapiliyor

import { createContext, useContext, useEffect, useState } from "react";
import { loadArray, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { newId } from "../utils/crypto";

const AuditLogContext = createContext(null);
const MAX_LOGS = 2000;
const MAX_ANONYMOUS_LOGS = 300;

export function AuditLogProvider({ children }) {
  const [logs, setLogs] = useState(() => loadArray(STORAGE_KEYS.ACTION_LOGS, []));

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
    setLogs((prev) => {
      const next = [entry, ...prev];
      if (entry.actorId) return next.slice(0, MAX_LOGS);
      // Kimliksiz (anonim) kayıtlar: sadece en yeni MAX_ANONYMOUS_LOGS tanesi tutulur
      let anon = 0;
      return next.filter((l) => l.actorId || ++anon <= MAX_ANONYMOUS_LOGS).slice(0, MAX_LOGS);
    });
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