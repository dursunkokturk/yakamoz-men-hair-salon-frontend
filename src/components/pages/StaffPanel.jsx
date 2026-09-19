// Bölüm 4 & 9.1 (v8): Personel bu sayfaya girdiği anda, bulunulan güne ait,
// Admin tarafından HENÜZ ONAYLANMAMIŞ (Randevu Durumu = "Onay Bekliyor") tüm
// randevular responsive bir tabloda, müşterinin tüm bilgileriyle görüntülenir.
// Admin bir randevuyu onayladığı anda (status → "approved"), kayıt bu tablodan
// otomatik olarak kaybolur ve "Personel Müşteri Takibi" (/staff/tracking) sayfasına geçer.
import { useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppointments, APPOINTMENT_STATUS } from "../../context/AppointmentContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { formatDateTR, todayISO } from "../../utils/dateUtils";

export function StaffPanel() {
  const { currentUser, logout } = useAuth();
  const { appointments } = useAppointments();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const today = todayISO();

  // v9 — yakın-gerçek-zamanlı senkron: sekme açıkken periyodik + tekrar görünür
  // olduğunda yenileme (bkz. Bölüm 9.1, "Bilinen Teknik Riskler").
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

  // Bölüm 27 (v8): Personel bu tabloda yalnızca müşteri adına veya hizmete göre filtreleyebilir.
  const pendingToday = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return appointments
      // v9, madde 4: status === "pending" kontrolü zaten iptal edilmiş (status === "cancelled")
      // kayıtları otomatik dışlar, çünkü bir randevu aynı anda iki farklı status değerine
      // sahip olamaz. Bu satır Bölüm 8'deki "İptal edilen randevu" kuralını uygular.
      .filter((a) => a.date === today && a.status === APPOINTMENT_STATUS.PENDING)
      .filter(
        (a) =>
          !q ||
          a.fullName.toLocaleLowerCase("tr-TR").includes(q) ||
          a.serviceName.toLocaleLowerCase("tr-TR").includes(q)
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, today, query]);

  return (
    <div className="page page--staff">
      <div className="admin-topbar">
        <div>
          <h1>Bugünün Tüm Randevuları</h1>
          <p>{formatDateTR(today)} · Hoş geldin, {currentUser?.fullName || currentUser?.username}</p>
        </div>
        <div className="appointment-detail__actions">
          <Button variant="ghost" onClick={logout}>
            <LogOut size={16} /> Çıkış
          </Button>
        </div>
      </div>

      <input
        type="text"
        className="ui-field__input"
        placeholder="Müşteri adına veya hizmete göre filtrele..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 16 }}
      />

      {pendingToday.length === 0 ? (
        <p className="admin-appointments__empty">Bugün için Admin onayı bekleyen randevu yok.</p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table staff-today-table">
            <thead>
              <tr>
                <th>Müşteri Adı</th>
                <th>Yapılacak İşlem</th>
                <th>Randevu Tarihi ve Saati</th>
                <th>İşlem Süresi</th>
                <th>Telefon Numarası</th>
                <th>İşlem Ücreti</th>
                <th>Kuaför Onay Durumu</th>
              </tr>
            </thead>
            <tbody>
              {pendingToday.map((a) => (
                <tr key={a.id}>
                  <td data-label="Müşteri Adı">{a.fullName}</td>
                  <td data-label="Yapılacak İşlem">{a.serviceName}</td>
                  <td data-label="Randevu Tarihi ve Saati">{formatDateTR(a.date)} · {a.time}</td>
                  <td data-label="İşlem Süresi">{a.durationMinutes} dk</td>
                  <td data-label="Telefon Numarası">{a.phone}</td>
                  <td data-label="İşlem Ücreti">{a.price} ₺</td>
                  <td data-label="Kuaför Onay Durumu">
                    {/* Bölüm 4: Bu tabloda göründüğü sürece daima "Onay Bekliyor" */}
                    <Badge status="pending">Onay Bekliyor</Badge>
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