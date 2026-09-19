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

export function StaffTracking() {
  const { currentUser, logout, role } = useAuth();
  const { appointments, completeAppointment, approveStaffWork } = useAppointments();
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState(() => FILTERS.map((f) => f.value));
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
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    return () => clearInterval(interval);
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

  function handleApprove(appointment) {
    approveStaffWork(appointment.id, currentUser);
    toast.success("İşlem onaylandı");
  }

  // v9, madde 6: "Tamamla" — hizmet bitince randevuDurumu = "Tamamlandı" yapar.
  // Bu, "Onayla"dan ayrı bir eylemdir ve Admin'in yanı sıra artık yetkilendirilmiş
  // Personel tarafından da bu tablodan doğrudan tetiklenebilir.
  function handleComplete(appointment) {
    completeAppointment(appointment.id, currentUser);
    toast.success("İşlem tamamlandı olarak işaretlendi, onay bekleniyor");
  }

  {
    filtered.map((a) => (
      <tr key={a.id}>
        <td data-label="Müşteri Adı">{a.fullName}</td>
        <td data-label="Yapılacak İşlem">{a.serviceName}</td>
        <td data-label="Randevu Tarihi ve Saati">{formatDateTR(a.date)} · {a.time}</td>
        <td data-label="İşlem Süresi">{a.durationMinutes} dk</td>
        <td data-label="Telefon Numarası">{a.phone}</td>
        <td data-label="İşlem Ücreti">{a.price} ₺</td>
        <td data-label="İşlem Durumu">{renderStatusCell(a)}</td>
        <td data-label="">
          {/* v9: hizmet henüz "Tamamlandı" işaretlenmemişse (status=approved),
                        "Tamamla" butonu gösterilir. */}
          {a.status === APPOINTMENT_STATUS.APPROVED && (
            <Button size="sm" variant="ghost" onClick={() => handleComplete(a)}>
              <Scissors size={16} /> Tamamla
            </Button>
          )}
          {/* v9: "Süresi Geçti" bir kilit değildir — bu butonun görünürlüğü
                        yalnızca henüz onaylanmamış olmasına bağlıdır, süre aşımına değil. */}
          {a.status === APPOINTMENT_STATUS.COMPLETED &&
            a.staffApprovalStatus === STAFF_APPROVAL_STATUS.PENDING && (
              <Button size="sm" onClick={() => handleApprove(a)}>
                <CheckCircle2 size={16} /> Onayla
              </Button>
            )}
          {a.status === APPOINTMENT_STATUS.COMPLETED &&
            a.staffApprovalStatus === STAFF_APPROVAL_STATUS.EXPIRED && (
              <Button size="sm" onClick={() => handleApprove(a)}>
                <CheckCircle2 size={16} /> Onayla
              </Button>
            )}
        </td>
      </tr>
    ))
  }
}