// Bulunulan Gune Ait, Zaten Onaylanmis Islemlerin Salt Okunur Listesi
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppointments, STAFF_APPROVAL_STATUS, APPOINTMENT_STATUS } from "../../context/AppointmentContext";
import { Button } from "../ui/Button";
import { formatDateTR, todayISO } from "../../utils/dateUtils";

export function StaffApprovedToday() {
  const { currentUser, logout, role } = useAuth();
  const { appointments } = useAppointments();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const today = todayISO();

  const approvedToday = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return appointments
      .filter(
        (a) =>
          a.date === today &&
          a.status === APPOINTMENT_STATUS.COMPLETED &&
          a.staffApprovalStatus === STAFF_APPROVAL_STATUS.APPROVED
      )
      .filter((a) => !q || a.fullName.toLocaleLowerCase("tr-TR").includes(q) || a.serviceName.toLocaleLowerCase("tr-TR").includes(q))
      .sort((a, b) => (a.staffApprovedAt || "").localeCompare(b.staffApprovedAt || ""));
  }, [appointments, today, query]);

  return (
    <div className="page page--staff">
      <div className="admin-topbar">
        <div>
          <h1>Günlük Onaylı Müşteriler</h1>
          <p>{formatDateTR(today)} · Hoş geldin, {currentUser?.fullName || currentUser?.username}</p>
        </div>
        <div className="appointment-detail__actions">
          {role === "staff" && (
            <Button variant="ghost" onClick={() => navigate("/staff")}>İşlem Onay Paneline Dön</Button>
          )}
          <Button variant="ghost" onClick={logout}><LogOut size={16} /> Çıkış</Button>
        </div>
      </div>

      <input
        type="text"
        className="ui-field__input"
        placeholder="Hizmet veya müşteri adına göre filtrele..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 16 }}
      />

      <div className="admin-blocked__list">
        {approvedToday.length === 0 && (
          <p className="admin-appointments__empty">Bugün için onaylanmış işlem bulunmuyor.</p>
        )}
        {approvedToday.map((a) => (
          <div key={a.id} className="admin-blocked__item">
            <div>
              <strong><CheckCircle2 size={14} /> {a.fullName} — {a.serviceName}</strong>
              <span>Telefon: {a.phone}</span>
              <span>{formatDateTR(a.date)} · {a.time}</span>
              <span>İşlem Süresi: {a.durationMinutes} dk</span>
              <span>Ücret: {a.price} ₺</span>
              <span className="admin-blocked__date">
                Onaylayan: {a.staffApprovedBy} · {a.staffApprovedAt ? new Date(a.staffApprovedAt).toLocaleString("tr-TR") : "-"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}