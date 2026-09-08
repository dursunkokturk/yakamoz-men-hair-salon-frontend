// Admin'e Personel Hesabi Olusturabilme, Silebilme, Aktif-Pasif Yapabilme Yetkileri Veriliyor

import { useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, UserCog } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function StaffManager() {
  const { staffUsers, addStaffUser, updateStaffUser, deleteStaffUser } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", password: "" });

  function handleAdd() {
    if (!form.fullName.trim() || !form.username.trim() || form.password.length < 6) {
      toast.error("Ad soyad, kullanıcı adı ve en az 6 haneli şifre girin");
      return;
    }
    try {
      addStaffUser(form);
      toast.success("Personel hesabı oluşturuldu");
      setForm({ fullName: "", username: "", password: "" });
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err.message === "USERNAME_TAKEN" ? "Bu kullanıcı adı zaten kullanılıyor" : "Personel eklenemedi");
    }
  }

  function handleDelete(staff) {
    if (window.confirm(`"${staff.fullName}" personelinin hesabını silmek istiyor musunuz?`)) {
      const alsoDeleteHistory = window.confirm("Geçmiş işlem kayıtları da silinsin mi? (İptal = sadece hesap silinir)");
      deleteStaffUser(staff.id, { alsoDeleteHistory });
      toast.info("Personel hesabı silindi");
    }
  }

  return (
    <div className="service-manager">
      <div className="service-manager__header">
        <h3><UserCog size={18} /> Personel Yönetimi</h3>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus size={16} /> Yeni personel
        </Button>
      </div>

      <ul className="service-manager__list">
        {staffUsers.map((s) => (
          <li key={s.id} className={`service-manager__item ${!s.isActive ? "service-manager__item--inactive" : ""}`}>
            <div>
              <strong>{s.fullName}</strong>
              <span className="service-manager__item-meta">
                @{s.username} · {new Date(s.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </div>
            <div className="service-manager__item-actions">
              <button type="button" onClick={() => updateStaffUser(s.id, { isActive: !s.isActive })}>
                {s.isActive ? "Pasife al" : "Aktif et"}
              </button>
              <button type="button" onClick={() => handleDelete(s)} aria-label="Sil">
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
        {staffUsers.length === 0 && <p className="service-manager__empty">Henüz personel eklenmedi.</p>}
      </ul>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Yeni personel ekle">
        <div className="service-form">
          <Input label="Ad Soyad" value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Kullanıcı adı" value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          <Input label="Şifre" type="password" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <div className="service-form__actions">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Vazgeç</Button>
            <Button onClick={handleAdd}>Kaydet</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}