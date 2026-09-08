// Kullanici ve Islem Tarih / Saat Bilgisini Listeleme

import { useState } from "react";
import { useAuditLog } from "../../context/AuditLogContext";

export function AuditLogPanel() {
  const { logs } = useAuditLog();
  const [userFilter, setUserFilter] = useState("all");

  const uniqueUsers = [...new Set(logs.map((l) => l.actorUsername).filter(Boolean))];
  const filtered = userFilter === "all" ? logs : logs.filter((l) => l.actorUsername === userFilter);

  return (
    <div className="service-manager">
      <div className="service-manager__header">
        <h3>İşlem Kayıtları (Audit Log)</h3>
        <select className="ui-field__input ui-field__select" value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}>
          <option value="all">Tüm kullanıcılar</option>
          {uniqueUsers.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Tarih/Saat</th><th>Kullanıcı</th><th>Rol</th><th>İşlem</th><th>Açıklama</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.timestamp).toLocaleString("tr-TR")}</td>
              <td>{l.actorUsername || "-"}</td>
              <td>{l.actorRole === "admin" ? "Admin" : l.actorRole === "staff" ? "Personel" : "-"}</td>
              <td>{l.actionType}</td>
              <td>{l.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="service-manager__empty">Kayıt yok.</p>}
    </div>
  );
}