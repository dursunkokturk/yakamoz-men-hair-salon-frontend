import { useEffect } from "react";
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

const DEFAULT_FILTERS = { status: "all", serviceId: "all", customerName: "" };

/**
 * Randevu listesi için durum / hizmet / müşteri adı filtreleri.
 * Son kullanılan filtreler localStorage'da saklanır (Bölüm 25).
 */
export function AppointmentFilters({ onChange }) {
  const { services } = useServices();
  const [filters, setFilters] = useLocalStorage(STORAGE_KEYS.ADMIN_FILTERS, DEFAULT_FILTERS);
  const debouncedName = useDebounce(filters.customerName, 300);

  useEffect(() => {
    onChange({ ...filters, customerName: debouncedName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.serviceId, debouncedName]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
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