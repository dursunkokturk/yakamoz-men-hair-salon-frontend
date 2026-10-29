// Giris Yapan Kullaniciya Gore Yapilacak Islemlerin Gosterilmesi

import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function Login() {
  const { needsSetup } = useAuth();
  return needsSetup ? <SetupAdminForm /> : <LoginForm />;
}

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { username: "", password: "" } });

  async function onSubmit(values) {
    try {
      const user = await login(values.username.trim(), values.password);
      toast.success("Hoş geldiniz");
      navigate(user.role === "staff" ? "/staff" : "/admin");
    } catch (err) {
      if (err.message === "ACCOUNT_LOCKED") {
        setError("root", { message: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." });
      } else if (err.message === "INSECURE_CONTEXT") {
        setError("root", { message: "Güvenli bağlantı (HTTPS) gerekli. Siteyi https:// ile açın." });
      } else {
        setError("root", { message: "Kullanıcı adı veya şifre hatalı" });
      }
    }
  }

  return (
    <div className="page page--login">
      <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="login-form__icon"><LogIn size={28} /></div>
        <h1>Berber / Personel Girişi</h1>
        <p>Randevuları yönetmek veya işlemleri onaylamak için giriş yapın.</p>

        <Input
          label="Kullanıcı adı"
          error={errors.username?.message}
          {...register("username", { required: "Kullanıcı adı zorunludur" })}
        />
        <Input
          label="Şifre"
          type="password"
          error={errors.password?.message}
          {...register("password", { required: "Şifre zorunludur" })}
        />
        {errors.root && <p className="login-form__error">{errors.root.message}</p>}

        <Button type="submit" size="lg" isLoading={isSubmitting}>Giriş Yap</Button>
      </form>
    </div>
  );
}

function SetupAdminForm() {
  const { setupAdminPassword } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: "", confirm: "" } });
  const password = watch("password");

  async function onSubmit(values) {
    try {
      await setupAdminPassword(values.password);
      toast.success("Admin şifresi belirlendi. Şimdi giriş yapabilirsiniz.");
    } catch {
      toast.error("Şifre belirlenemedi");
    }
  }

  return (
    <div className="page page--login">
      <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="login-form__icon"><ShieldCheck size={28} /></div>
        <h1>İlk Kurulum</h1>
        <p>Admin hesabı için bir şifre belirleyin (kullanıcı adı: admin).</p>

        <Input
          label="Yeni şifre"
          type="password"
          error={errors.password?.message}
          {...register("password", {
            required: "Şifre zorunludur",
            minLength: { value: 10, message: "Şifre en az 10 karakter olmalı" },
          })}
        />
        <Input
          label="Şifre (tekrar)"
          type="password"
          error={errors.confirm?.message}
          {...register("confirm", {
            required: "Şifreyi tekrar girin",
            validate: (v) => v === password || "Şifreler eşleşmiyor",
          })}
        />
        <Button type="submit" size="lg" isLoading={isSubmitting}>Şifreyi Belirle</Button>
      </form>
    </div>
  );
}