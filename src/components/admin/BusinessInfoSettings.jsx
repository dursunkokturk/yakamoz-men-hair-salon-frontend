import { useState } from "react";
import { toast } from "react-toastify";
import { Store } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function BusinessInfoSettings() {
  const { settings, updateSettings } = useSettings();
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);

  function handleSave() {
    if (!businessName.trim() || !phone.trim() || !address.trim()) {
      toast.error("Tüm alanları doldurun");
      return;
    }
    updateSettings({
      businessName: businessName.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    toast.success("İşletme bilgileri güncellendi");
  }

  return (
    <div className="password-settings">
      <div className="password-settings__header">
        <Store size={20} />
        <h3>İşletme Bilgileri</h3>
      </div>

      <Input
        label="İşletme Adı"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
      />
      <Input
        label="Telefon"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Input
        label="Adres"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <Button onClick={handleSave}>Kaydet</Button>
    </div>
  );
}