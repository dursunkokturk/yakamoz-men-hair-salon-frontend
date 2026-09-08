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
import { formatDateTR } from "../../utils/dateUtils";

const FILTERS = [
  { value: STAFF_APPROVAL_STATUS.PENDING, label: "Onay Bekleyen" },
  { value: STAFF_APPROVAL_STATUS.APPROVED, label: "Onaylanmış" },
  { value: STAFF_APPROVAL_STATUS.EXPIRED, label: "Süresi Geçen" },
];

export function StaffPanel() {
  const { currentUser, logout } = useAuth();
  const { appointments, approveStaffWork } = useAppointments();
  const [filter, setFilter] = useState(STAFF_APPROVAL_STATUS.PENDING);

  useApprovalWatcher(); // Bölüm 9.1: panel açıkken periyodik + mount anında kontrol

  const completed = useMemo(
    () => appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED && a.staffApprovalStatus),
    [appointments]
  );
  const filtered = completed
    .filter((a) => a.staffApprovalStatus === filter)
    .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

  function handleApprove(appointment) {
    approveStaffWork(appointment.id, currentUser);
    toast.success("İşlem onaylandı");
  }

  return (
    <div className="page page--staff">
      <div className="admin-topbar">
        <div>
          <h1>İşlem Onay Paneli</h1>
          <p>Hoş geldin, {currentUser?.fullName || currentUser?.username}</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          <LogOut size={16} /> Çıkış
        </Button>
      </div>

      <div className="admin-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`admin-tabs__item ${filter === f.value ? "is-active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-blocked__list">
        {filtered.length === 0 && <p className="admin-appointments__empty">Bu filtrede kayıt yok.</p>}
        {filtered.map((a) => (
          <div key={a.id} className="admin-blocked__item">
            <div>
              <strong>{a.fullName} — {a.serviceName}</strong>
              <span>{formatDateTR(a.date)} · {a.time}</span>
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
            <Badge
              status={
                a.staffApprovalStatus === STAFF_APPROVAL_STATUS.APPROVED
                  ? "approved"
                  : a.staffApprovalStatus === STAFF_APPROVAL_STATUS.EXPIRED
                  ? "cancelled"
                  : "pending"
              }
            >
              {a.staffApprovalStatus === STAFF_APPROVAL_STATUS.APPROVED
                ? "Onaylandı"
                : a.staffApprovalStatus === STAFF_APPROVAL_STATUS.EXPIRED
                ? "Süresi Geçti"
                : "Onay Bekliyor"}
            </Badge>
            {a.staffApprovalStatus === STAFF_APPROVAL_STATUS.PENDING && (
              <Button size="sm" onClick={() => handleApprove(a)}>
                <CheckCircle2 size={16} /> Onayla
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}