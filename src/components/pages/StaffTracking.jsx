// Personel Müşteri Takibi — Admin tarafından onaylanmış randevuların listesi;
// Personel burada hizmeti tamamlayıp onaylar.
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { LogOut, CheckCircle2, Scissors } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppointments, APPOINTMENT_STATUS, STAFF_APPROVAL_STATUS } from "../../context/AppointmentContext";
import { useApprovalWatcher } from "../../hooks/useApprovalWatcher";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { formatDateTR, todayISO } from "../../utils/dateUtils";

const FILTERS = [
  { value: "waiting", label: "Onay Bekleniyor" },
  { value: STAFF_APPROVAL_STATUS.APPROVED, label: "Onaylandı" },
  { value: STAFF_APPROVAL_STATUS.EXPIRED, label: "Süresi Geçti" },
];

export function StaffTracking() {
  const { currentUser, logout, role } = useAuth();
  const { appointments, completeAppointment, approveStaffWork } = useAppointments();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0].value);
  const today = todayISO();

  useApprovalWatcher();

  // v9 — Bilinen Teknik Riskler: cihazlar arası anlık senkron yok. Sekme açıkken
  // periyodik olarak (60 sn) ve tekrar görünür hale geldiğinde (visibilitychange)
  // appointments state'i zaten AppointmentProvider tarafından localStorage'dan tek
  // seferde yüklendiği için, burada localStorage'ı yeniden okuyup state'i tazelemek
  // için bir "force refresh" tetikleyicisi kullanıyoruz.
  const [, forceTick] = useState(0);
  useEffect(() => {
    function refresh() {
      forceTick((n) => n + 1);
    }
    const interval = setInterval(refresh, 60 * 1000);

    function handleVisibility() {
      if (document.visibilityState === "visible") refresh();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    }
  }, []);

  // v9, madde 4: İptal edilen randevular (status === "cancelled") bu tablodan
  // otomatik dışlanır — filtre zaten yalnızca APPROVED/COMPLETED kabul ettiği
  // için CANCELLED kayıtlar buraya hiç girmiyor; bunu açıkça belgeliyoruz.
  const trackedToday = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.date === today &&
            a.status !== APPOINTMENT_STATUS.CANCELLED &&
            (a.status === APPOINTMENT_STATUS.APPROVED || a.status === APPOINTMENT_STATUS.COMPLETED)
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, today]
  );

  function getTrackingState(a) {
    if (a.staffApprovalStatus === STAFF_APPROVAL_STATUS.APPROVED) return STAFF_APPROVAL_STATUS.APPROVED;
    if (a.staffApprovalStatus === STAFF_APPROVAL_STATUS.EXPIRED) return STAFF_APPROVAL_STATUS.EXPIRED;
    return "waiting";
  }

  const filtered = trackedToday.filter(
    (a) => getTrackingState(a) === selectedFilter
  );

  function handleApprove(appointment) {
    try {
      approveStaffWork(appointment.id, currentUser);
      toast.success("İşlem onaylandı");
    } catch {
      toast.error("İşlem yapılamadı, kayıt durumu değişmiş olabilir");
    }
  }

  // v9, madde 6: "Tamamla" — hizmet bitince randevuDurumu = "Tamamlandı" yapar.
  // Bu, "Onayla"dan ayrı bir eylemdir ve Admin'in yanı sıra artık yetkilendirilmiş
  // Personel tarafından da bu tablodan doğrudan tetiklenebilir.
  function handleComplete(appointment) {
    try {
      completeAppointment(appointment.id, currentUser);
      toast.success("İşlem tamamlandı olarak işaretlendi, onay bekleniyor");
    } catch {
      toast.error("İşlem yapılamadı, kayıt durumu değişmiş olabilir");
    }
  }

  function renderStatusCell(a) {
    const state = getTrackingState(a);
    if (state === STAFF_APPROVAL_STATUS.APPROVED) {
      return <Badge status="approved">{a.staffApprovedBy} onayladı</Badge>;
    }
    if (state === STAFF_APPROVAL_STATUS.EXPIRED) {
      return <Badge status="cancelled">Süresi Geçti</Badge>;
    }
    return <Badge status="pending">Onay Bekleniyor</Badge>;
  }

  return (
    <div className="page page--staff">
      <div className="admin-topbar">
        <div>
          <h1>Personel Müşteri Takibi</h1>
          <p>{formatDateTR(today)} · Hoş geldin, {currentUser?.fullName || currentUser?.username}</p>
        </div>
        <div className="appointment-detail__actions">
          {role === "staff" && (
            <Button variant="ghost" onClick={() => navigate("/staff")}>Bugünün Tüm Randevuları</Button>
          )}
          <Button variant="ghost" onClick={logout}><LogOut size={16} /> Çıkış</Button>
        </div>
      </div>

      <div className="admin-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`admin-tabs__item ${selectedFilter === f.value ? "is-active" : ""}`}
            onClick={() => setSelectedFilter(f.value)}
            aria-pressed={selectedFilter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="admin-appointments__empty">
          Bugün için bu filtrede kayıt yok.
        </p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table staff-tracking-table">
            <thead>
              <tr>
                <th>Müşteri Adı</th>
                <th>Yapılacak İşlem</th>
                <th>Randevu Tarihi ve Saati</th>
                <th>İşlem Süresi</th>
                <th>Telefon Numarası</th>
                <th>İşlem Ücreti</th>
                <th>İşlem Durumu</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td data-label="Müşteri Adı">{a.fullName}</td>
                  <td data-label="Yapılacak İşlem">{a.serviceName}</td>
                  <td data-label="Randevu Tarihi ve Saati">{formatDateTR(a.date)} · {a.time}</td>
                  <td data-label="İşlem Süresi">{a.durationMinutes} dk</td>
                  <td data-label="Telefon Numarası">{a.phone}</td>
                  <td data-label="İşlem Ücreti">{a.price} ₺</td>
                  <td data-label="İşlem Durumu">{renderStatusCell(a)}</td>
                  <td data-label="">
                    {a.status === APPOINTMENT_STATUS.APPROVED && (
                      <Button size="sm" variant="ghost" onClick={() => handleComplete(a)}>
                        <Scissors size={16} /> Tamamla
                      </Button>
                    )}
                    {a.status === APPOINTMENT_STATUS.COMPLETED &&
                      (a.staffApprovalStatus === STAFF_APPROVAL_STATUS.PENDING ||
                        a.staffApprovalStatus === STAFF_APPROVAL_STATUS.EXPIRED) && (
                        <Button size="sm" onClick={() => handleApprove(a)}>
                          <CheckCircle2 size={16} /> Onayla
                        </Button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}