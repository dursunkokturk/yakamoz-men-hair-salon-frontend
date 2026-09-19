// Onaylari ve Bayram Donemi Randevu Sayilarini Gorme

import { useState } from "react";
import { toast } from "react-toastify";
import { Clock3 } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { Button } from "../ui/Button";

export function ApprovalSettings() {
  const { settings, updateSettings } = useSettings();
  const [bayramMode, setBayramMode] = useState(Boolean(settings.maxAppointmentsPerSlotOverride));

  function handleSave() {
    updateSettings({
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

      <p className="ui-field__hint">
        Personel onay süresi sabit olarak <strong>1 saattir</strong> Personel, işlem
        bitiminden itibaren 1 saat içinde onaylamazsa sistem otomatik olarak Admin'e bildirim gönderir.
      </p>

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