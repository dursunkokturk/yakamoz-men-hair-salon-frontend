import { toast } from "react-toastify";
import { CalendarOff } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { Select } from "../ui/Select";
import { WEEKDAY_LABELS } from "../../utils/dateUtils";
import { useAuth } from "../../context/AuthContext";

const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, value) => ({ value, label }));

export function BusinessHoursSettings() {
  const { settings, updateSettings } = useSettings();
  const { currentUser } = useAuth();

  function handleChange(e) {
    updateSettings({
      closedWeekday: Number(e.target.value)
    }, currentUser);
    toast.success("Haftalık kapalı gün güncellendi");
  }

  return (
    <div className="business-hours-settings">
      <div className="password-settings__header">
        <CalendarOff size={20} />
        <h3>Çalışma Günleri</h3>
      </div>
      <Select label="Haftalık kapalı gün" value={settings.closedWeekday} onChange={handleChange}>
        {WEEKDAY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>
    </div>
  );
}