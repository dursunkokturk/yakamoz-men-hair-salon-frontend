// Onaylari ve Bayram Donemi Randevu Sayilarini Gorme

import { useState } from "react";
import { toast } from "react-toastify";
import { Clock3 } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function ApprovalSettings() {
  const { settings, updateSettings } = useSettings();
  const [timeoutHours, setTimeoutHours] = useState(settings.staffApprovalTimeoutHours);
  const [bayramMode, setBayramMode] = useState(Boolean(settings.maxAppointmentsPerSlotOverride));

  function handleSave() {
    const hours = Number(timeoutHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      toast.error("Geçerli bir saat değeri girin");
      return;
    }
    updateSettings({
      staffApprovalTimeoutHours: hours,
      // Bölüm 6: bayram modu açıkken azami 2, kapalıyken null (varsayılan: 1)
      maxAppointmentsPerSlotOverride: bayramMode ? 2 : null,
    });
    toast.success("Onay ayarları güncellendi");
  }

  return (
    <div className="password-settings">
      <div className="password-settings__header">
        <Clock3 size={20} />
        <h3>Personel Onayı &amp; Randevu Kapasitesi</h3>
      </div>

      <Input
        label="Personel onay süresi (saat)"
        type="number"
        min={1}
        hint="Personel bu süre içinde tamamlanan işlemi onaylamazsa Admin'e bildirim gider."
        value={timeoutHours}
        onChange={(e) => setTimeoutHours(e.target.value)}
      />

      <label className="service-form__toggle">
        <input
          type="checkbox"
          checked={bayramMode}
          onChange={(e) => setBayramMode(e.target.checked)}
        />
        <span>Bayram/istisna dönemi: aynı saate azami 2 randevu (normalde 1)</span>
      </label>

      <Button onClick={handleSave}>Kaydet</Button>
    </div>
  );
}