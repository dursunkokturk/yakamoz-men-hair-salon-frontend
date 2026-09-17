// Yetki Verilen Personel Gunluk Musteri Listesini Gorebilir 
// Islem Bitimi Onay Verebilir

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppointments, STAFF_APPROVAL_STATUS, APPOINTMENT_STATUS } from "../../context/AppointmentContext";
import { useApprovalWatcher } from "../../hooks/useApprovalWatcher";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { formatDateTR, todayISO } from "../../utils/dateUtils";

const FILTERS = [
  { value: STAFF_APPROVAL_STATUS.PENDING, label: "Onay Bekleyen" },
  { value: STAFF_APPROVAL_STATUS.APPROVED, label: "Onaylanmış" },
  { value: STAFF_APPROVAL_STATUS.EXPIRED, label: "Süresi Geçen" },
];

const STATUS_BADGE_MAP = {
  [STAFF_APPROVAL_STATUS.APPROVED]: { badgeStatus: "approved", label: "Onaylanmış" },
  [STAFF_APPROVAL_STATUS.EXPIRED]: { badgeStatus: "cancelled", label: "Süresi Geçmiş" },
  [STAFF_APPROVAL_STATUS.PENDING]: { badgeStatus: "pending", label: "Onay Bekleyen" },
};

export function StaffPanel() {
  const { currentUser, logout } = useAuth();
  const { appointments, approveStaffWork } = useAppointments();
  // Bölüm 27 (v5): tüm durumlar filtrelenebilir olmalı ve birden fazlası birlikte
  // seçilebilmeli — varsayılan olarak üçü de seçili gelir (panel açılışında filtresiz tam liste).
  const [selectedStatuses, setSelectedStatuses] = useState(() => FILTERS.map((f) => f.value));
  const today = todayISO();

  useApprovalWatcher(); // Bölüm 9.1: panel açıkken periyodik + mount anında kontrol

  // "o güne ait" — panel yalnızca bulunulan günün tamamlanmış
  // işlemlerini otomatik yükler, ayrı bir "listele" adımı gerekmez.
  const completed = useMemo(
    () => appointments.filter(
      (a) => a.status === APPOINTMENT_STATUS.COMPLETED && a.staffApprovalStatus && a.date === today),
    [appointments, today]
  );
  const filtered = completed
    .filter((a) => selectedStatuses.includes(a.staffApprovalStatus))
    .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

  function toggleStatus(value) {
    setSelectedStatuses((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function handleApprove(appointment) {
    approveStaffWork(appointment.id, currentUser);
    toast.success("İşlem onaylandı");
  }

  return (
    <div className="page page--staff">
      <div className="admin-topbar">
        <div>
          <h1>İşlem Onay Paneli</h1>
          <p>{formatDateTR(today)} Hoş geldin, {currentUser?.fullName || currentUser?.username}</p>
        </div>
        <div className="appointment-detail__actions">
          <Button variant="ghost" onClick={logout}>
            <LogOut size={16} /> Çıkış
          </Button>
        </div>
      </div>

      <div className="admin-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`admin-tabs__item ${selectedStatuses.includes(f.value) ? "is-active" : ""}`}
            onClick={() => toggleStatus(f.value)}
            aria-pressed={selectedStatuses.includes(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-blocked__list">
        {filtered.length === 0 && (
          <p className="admin-appointments__empty">
            {selectedStatuses.length === 0
              ? "Görmek için en az bir durum seçin."
              : "Bugün için bu filtrede kayıt yok."}
          </p>
        )}
        {filtered.map((a) => {
          const badgeInfo = STATUS_BADGE_MAP[a.staffApprovalStatus];
          return (
            <div key={a.id} className="admin-blocked__item">
              <div>
                <strong>{a.fullName} — {a.serviceName}{" "}
                  <span className="staff-status-inline">
                    <Badge status={badgeInfo.badgeStatus}>{badgeInfo.label}</Badge>
                  </span>
                </strong>
                <span>{formatDateTR(a.date)} · {a.time}</span>
                {a.staffApprovalStatus === STAFF_APPROVAL_STATUS.APPROVED && (
                  <span>Telefon: {a.phone}</span>
                )}
                {a.staffApprovalStatus === STAFF_APPROVAL_STATUS.APPROVED && (
                  <span>İşlem Süresi: {a.durationMinutes} dk</span>
                )}
                <span>Ücret: {a.price} ₺</span>
                <span className="admin-blocked__date">
                  Tamamlanma: {a.completedAt ? new Date(a.completedAt).toLocaleString("tr-TR") : "-"}
                </span>
                {a.staffApprovalStatus === STAFF_APPROVAL_STATUS.APPROVED && (
                  <span className="admin-blocked__date">
                    Onaylayan: {a.staffApprovedBy} ·{" "}
                    {a.staffApprovedAt ? new Date(a.staffApprovedAt).toLocaleString("tr-TR") : ""}
                  </span>
                )}
              </div>
              {a.staffApprovalStatus === STAFF_APPROVAL_STATUS.PENDING && (
                <Button size="sm" onClick={() => handleApprove(a)}>
                  <CheckCircle2 size={16} /> Onayla
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}