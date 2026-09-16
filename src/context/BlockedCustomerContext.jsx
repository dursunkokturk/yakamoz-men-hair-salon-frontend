import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { nameKey } from "../utils/validation";
import { useAuditLog } from "./AuditLogContext";

const BlockedCustomerContext = createContext(null);

export function BlockedCustomerProvider({ children }) {
  const { logAction } = useAuditLog();
  const [blockedCustomers, setBlockedCustomers] = useState(() =>
    loadFromStorage(STORAGE_KEYS.BLOCKED_CUSTOMERS, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.BLOCKED_CUSTOMERS, blockedCustomers);
  }, [blockedCustomers]);

  function blockCustomer(fullName, phone, reason = "", actor) {
    const entry = {
      id: `blk-${Date.now()}`,
      fullName,
      phone,
      reason,
      blockedAt: new Date().toISOString(),
    };
    setBlockedCustomers((prev) => [...prev, entry]);

    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "BLOCK_CUSTOMER", targetTable: "blockedCustomers", targetId: entry.id,
      summary: `Müşteri engellendi: ${fullName} (${phone})`,
    });

    return entry;
  }

  function unblockCustomer(id, actor) {
    const target = blockedCustomers.find((b) => b.id === id);
    setBlockedCustomers((prev) => prev.filter((b) => b.id !== id));
    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "UNBLOCK_CUSTOMER", targetTable: "blockedCustomers", targetId: id,
      summary: `Müşteri engeli kaldırıldı: ${target?.fullName ?? id}`,
    });
  }

  /** Ad-Soyad ve Telefon kontrolü ile müşterinin engelli listede olup olmadığını döner. */
  function isCustomerBlocked(fullName, phone) {
    const key = nameKey(fullName);
    return blockedCustomers.some((b) => nameKey(b.fullName) === key && b.phone === phone);
  }

  return (
    <BlockedCustomerContext.Provider
      value={{ blockedCustomers, blockCustomer, unblockCustomer, isCustomerBlocked }}
    >
      {children}
    </BlockedCustomerContext.Provider>
  );
}

export function useBlockedCustomers() {
  const ctx = useContext(BlockedCustomerContext);
  if (!ctx) throw new Error("useBlockedCustomers, BlockedCustomerProvider içinde kullanılmalı");
  return ctx;
}
