import { createContext, useContext, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";
import { useAuditLog } from "./AuditLogContext";

const ServiceContext = createContext(null);

const DEFAULT_SERVICES = [
  { id: "svc-1", name: "Saç Kesimi", durationMinutes: 30, price: 300, isActive: true },
  { id: "svc-2", name: "Sakal Tıraşı", durationMinutes: 20, price: 200, isActive: true },
  { id: "svc-3", name: "Saç + Sakal", durationMinutes: 45, price: 450, isActive: true },
  { id: "svc-4", name: "Çocuk Saç Kesimi", durationMinutes: 25, price: 250, isActive: true },
  { id: "svc-5", name: "Fön / Şekillendirme", durationMinutes: 15, price: 150, isActive: true },
];

export function ServiceProvider({ children }) {
  const { logAction } = useAuditLog();
  const [services, setServices] = useState(() =>
    loadFromStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SERVICES, services);
  }, [services]);

  function addService(service, actor) {
    const newService = { ...service, id: `svc-${Date.now()}` };
    setServices((prev) => [...prev, newService]);
    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "ADD_SERVICE", targetTable: "services", targetId: newService.id,
      summary: `Hizmet eklendi: ${newService.name}`,
    });
    return newService;
  }

  function updateService(id, updates, actor) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    logAction({
      actorId: actor?.id, actorRole: actor?.role, actorUsername: actor?.username,
      actionType: "UPDATE_SERVICE", targetTable: "services", targetId: id,
      summary: "Hizmet güncellendi",
    });
  }

  function deleteService(id, actor) {
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
