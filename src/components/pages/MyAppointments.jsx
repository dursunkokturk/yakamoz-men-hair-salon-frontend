import { useState } from "react";
import { Search } from "lucide-react";
import { useAppointments, APPOINTMENT_STATUS } from "../../context/AppointmentContext";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatPhoneInput, isValidName, isValidPhone, nameKey } from "../../utils/validation";
import { formatDateTR } from "../../utils/dateUtils";

export function MyAppointments() {
  const { appointments } = useAppointments();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [searched, setSearched] = useState(null);

  const results = searched
    ? appointments
      .filter((a) => a.phone === searched.phone && nameKey(a.fullName)=== searched.key)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    : [];

  const canSearch = isValidPhone(phone) && isValidName(name);

  function handleSearch(e) {
    e.preventDefault();
    if (!canSearch) return;
    setSearched({ phone: phone.trim(), key:nameKey(name) });
  }

  return (
    <div className="page page--my-appointments">
      <div className="page-header">
        <h1>Randevularım</h1>
        <p>Ad Soyad ve Telefon numaranızı girerek randevu geçmişinizi görüntüleyin.</p>
      </div>

      <form className="lookup-form" onSubmit={handleSearch}>
        <Input
          label="Ad Soyad"
          placeholder="Adınız Soyadınız"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Telefon"
          placeholder="0555 555 55 55"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
        />
        <Button type="submit" disabled={!canSearch}>
          <Search size={16} /> Sorgula
        </Button>
      </form>

      {searched && (
        <div className="appointment-results">
          {results.length === 0 ? (
            <p className="appointment-results__empty">Girdiğiniz bilgilerle eşleşen randevu bulunamadı.</p>
          ) : (
            results.map((a) => (
              <Card key={a.id} className="appointment-result-card">
                <div className="appointment-result-card__row">
                  <strong>{a.serviceName}</strong>
                  <Badge status={a.status} />
                </div>
                <p>{formatDateTR(a.date)} · {a.time}</p>
                <p className="appointment-result-card__price">{a.price} ₺</p>
                {/* Sadece Onay Bekleyen Randevularda Gosterilir */}
                {a.status === APPOINTMENT_STATUS.PENDING && (
                  <p className="appointment-result-card__notice">
                    Randevunuzun onaylanma durumunu kontrol ediniz.
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
