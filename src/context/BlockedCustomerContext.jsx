import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { useAuditLog } from "./AuditLogContext";
import { assertRole, ROLES } from "../utils/permissions";
import { newId } from "../utils/crypto";

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
    assertRole(actor, ROLES.ADMIN);
    const cleanPhone = String(phone).trim();
    if (blockedCustomers.some((b) => b.phone === cleanPhone)) return null; // zaten engelli
    const entry = {
      id: newId("blk"),
      fullName: String(fullName).trim().slice(0, 60),
      phone: cleanPhone,
      reason: String(reason).trim().slice(0, 120),
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
    assertRole(actor, ROLES.ADMIN);
    const target = blockedCustomers.find((b) => b.id === id);
    setBlockedCustomers((prev) => prev.filter((b) => b.id !== id));
    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "UNBLOCK_CUSTOMER", targetTable: "blockedCustomers", targetId: id,
      summary: `Müşteri engeli kaldırıldı: ${target?.fullName ?? id}`,
    });
  }

  /** Telefon numarasına göre engelli mi? (İsim kolayca değiştirilebildiği için kullanılmaz.) */
  function isCustomerBlocked(fullName, phone) {
    return blockedCustomers.some((b) => b.phone === String(phone).trim());
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
