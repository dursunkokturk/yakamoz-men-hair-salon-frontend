import { useState } from "react";
import { CalendarOff, Clock3, KeyRound } from "lucide-react";
import { BusinessHoursSettings } from "./BusinessHoursSettings";
import { ApprovalSettings } from "./ApprovalSettings";
import { PasswordSettings } from "./PasswordSettings";

const SETTINGS_TABS = [
  { id: "hours", label: "Çalışma Günleri", icon: CalendarOff },
  { id: "approval", label: "Onay & Kapasite", icon: Clock3 },
  { id: "password", label: "Şifre Değiştir", icon: KeyRound },
];

export function SettingsPanel() {
  const [activeSubTab, setActiveSubTab] = useState("hours");

  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`settings-tabs__item ${activeSubTab === tab.id ? "is-active" : ""}`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="settings-panel__content">
        {activeSubTab === "hours" && <BusinessHoursSettings />}
        {activeSubTab === "approval" && <ApprovalSettings />}
        {activeSubTab === "password" && <PasswordSettings />}
      </div>
    </div>
  );
}