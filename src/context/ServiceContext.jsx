import { createContext, useContext, useEffect, useState } from "react";
import { loadArray, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { useAuditLog } from "./AuditLogContext";
import { assertRole, ROLES } from "../utils/permissions";
import { newId } from "../utils/crypto";

const ServiceContext = createContext(null);

const DEFAULT_SERVICES = [
  { id: "svc-1", name: "Saç Kesimi", durationMinutes: 30, price: 300, isActive: true },
  { id: "svc-2", name: "Sakal Tıraşı", durationMinutes: 20, price: 200, isActive: true },
  { id: "svc-3", name: "Saç + Sakal", durationMinutes: 45, price: 450, isActive: true },
  { id: "svc-4", name: "Çocuk Saç Kesimi", durationMinutes: 25, price: 250, isActive: true },
  { id: "svc-5", name: "Fön / Şekillendirme", durationMinutes: 15, price: 150, isActive: true },
];

/** Sadece bilinen alanları alır ve değerleri doğrular. Bozuk veri gelirse hata fırlatır. */
function cleanServiceInput(input) {
  const name = String(input?.name ?? "").trim().slice(0, 60);
  const durationMinutes = Number(input?.durationMinutes);
  const price = Number(input?.price);
  const valid =
    name &&
    Number.isFinite(durationMinutes) && durationMinutes >= 5 && durationMinutes <= 480 &&
    Number.isFinite(price) && price >= 0 && price <= 100000;
  if (!valid) throw new Error("INVALID_SERVICE_DATA");
  return { name, durationMinutes, price, isActive: input.isActive !== false };
}

export function ServiceProvider({ children }) {
  const { logAction } = useAuditLog();
  const [services, setServices] = useState(() =>
    loadArray(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SERVICES, services);
  }, [services]);

  function addService(service, actor) {
    assertRole(actor, ROLES.ADMIN);
    const newService = { ...cleanServiceInput(service), id: newId("svc") };
    setServices((prev) => [...prev, newService]);
    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "ADD_SERVICE", targetTable: "services", targetId: newService.id,
      summary: `Hizmet eklendi: ${newService.name}`,
    });
    return newService;
  }

  function updateService(id, updates, actor) {
    assertRole(actor, ROLES.ADMIN);
    const clean = cleanServiceInput(updates);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...clean } : s)));
    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "UPDATE_SERVICE", targetTable: "services", targetId: id,
      summary: "Hizmet güncellendi",
    });
  }

  function deleteService(id, actor) {
    assertRole(actor, ROLES.ADMIN);
    const target = services.find((s) => s.id === id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "DELETE_SERVICE", targetTable: "services", targetId: id,
      summary: `Hizmet silindi: ${target?.name ?? id}`,
    });
  }

  // Aktif / Pasif toggle
  function toggleServiceStatus(id, actor) {
    assertRole(actor, ROLES.ADMIN);
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "TOGGLE_SERVICE_STATUS", targetTable: "services", targetId: id,
      summary: "Hizmet aktif/pasif durumu değiştirildi",
    });
  }

  function getServiceById(id) {
    return services.find((s) => s.id === id) || null;
  }

  // Musteri Tarafinda Sadece Aktif Hizmetler Gosterilecek
  const activeServices = services.filter((s) => s.isActive !== false);

  return (
    <ServiceContext.Provider
      value={{ services, activeServices, addService, updateService, deleteService, toggleServiceStatus, getServiceById }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error("useServices, ServiceProvider içinde kullanılmalı");
  return ctx;
}
