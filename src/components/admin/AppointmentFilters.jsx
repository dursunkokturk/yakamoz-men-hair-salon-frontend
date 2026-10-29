import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useServices } from "../../context/ServiceContext";
import { APPOINTMENT_STATUS } from "../../context/AppointmentContext";
import { STORAGE_KEYS } from "../../utils/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useDebounce } from "../../hooks/useDebounce";

const STATUS_OPTIONS = [
  { value: "all", label: "Tüm Durumlar" },
  { value: APPOINTMENT_STATUS.PENDING, label: "Onay Bekliyor" },
  { value: APPOINTMENT_STATUS.APPROVED, label: "Onaylandı" },
  { value: APPOINTMENT_STATUS.COMPLETED, label: "Tamamlandı" },
  { value: APPOINTMENT_STATUS.CANCELLED, label: "İptal Edildi" },
];

/**
 * Randevu listesi için durum / hizmet / müşteri adı filtreleri.
 * Son kullanılan filtreler localStorage'da saklanır (Bölüm 25).
 */
export function AppointmentFilters({ onChange }) {
  const { services } = useServices();
  const [saved, setSaved] = useLocalStorage(STORAGE_KEYS.ADMIN_FILTERS, { status: "all", serviceId: "all" });

  // Eski sürümden kalan kişisel veriyi (müşteri adı) bir kez temizle
  useEffect(() => {
    if ("customerName" in saved) {
      setSaved(({ customerName: _old, ...rest }) => rest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [customerName, setCustomerName] = useState("");
  const filters = { ...saved, customerName };
  const debouncedName = useDebounce(filters.customerName, 300);

  useEffect(() => {
    onChange({ ...filters, customerName: debouncedName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.serviceId, debouncedName]);

  function updateFilter(key, value) {
    if (key === "customerName") setCustomerName(value);
    else setSaved((prev) => {
      const { customerName: _old, ...rest } = prev; // eski sürümden kalan kişisel veriyi at
      return { ...rest, [key]: value };
    });
  }

  function clearFilters() {
    setSaved({ status: "all", serviceId: "all" });
    setCustomerName("");
  }

  const hasActiveFilters =
    filters.status !== "all" || filters.serviceId !== "all" || filters.customerName.trim() !== "";

  return (
    <div className="appointment-filters">
      <div className="appointment-filters__field">
        <Search size={16} />
        <input
          type="text"
          className="ui-field__input"
          placeholder="Müşteri adına göre ara..."
          value={filters.customerName}
          onChange={(e) => updateFilter("customerName", e.target.value)}
        />
      </div>

      <select
        className="ui-field__input ui-field__select"
        value={filters.status}
        onChange={(e) => updateFilter("status", e.target.value)}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        className="ui-field__input ui-field__select"
        value={filters.serviceId}
        onChange={(e) => updateFilter("serviceId", e.target.value)}
      >
        <option value="all">Tüm Hizmetler</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button type="button" className="appointment-filters__clear" onClick={clearFilters}>
          <X size={14} /> Temizle
        </button>
      )}
    </div>
  );
}