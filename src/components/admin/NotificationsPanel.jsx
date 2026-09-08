// Bildirimler Sekmesi Olusturuldu

import { useNotifications, NOTIFICATION_TYPES } from "../../context/NotificationContext";
import { BellRing } from "lucide-react";

export function NotificationsPanel() {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div className="service-manager">
      <div className="service-manager__header">
        <h3><BellRing size={18} /> Bildirimler</h3>
      </div>
      <ul className="admin-blocked__list">
        {notifications.map((n) => (
          <li key={n.id} className="admin-blocked__item" onClick={() => markAsRead(n.id)}>
            <div>
              <strong>
                {n.type === NOTIFICATION_TYPES.STAFF_APPROVAL_EXPIRED
                  ? "Personel süresi içinde onaylamadı"
                  : "Personel onayladı"}
              </strong>
              <span>{n.customerName} · {n.phone} · {n.amount} ₺</span>
              <span className="admin-blocked__date">
                İşlem: {n.occurredAt ? new Date(n.occurredAt).toLocaleString("tr-TR") : "-"} ·
                Bildirim: {new Date(n.createdAt).toLocaleString("tr-TR")}
              </span>
            </div>
            {!n.readAt && <span className="ui-badge ui-badge--pending">Yeni</span>}
          </li>
        ))}
        {notifications.length === 0 && <p className="service-manager__empty">Bildirim yok.</p>}
      </ul>
    </div>
  );
}