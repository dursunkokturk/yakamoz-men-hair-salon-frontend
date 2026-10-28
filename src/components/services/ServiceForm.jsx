import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function ServiceForm({ initialValues, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialValues ?? { name: "", durationMinutes: 30, price: 0, isActive: true },
  });

  useEffect(() => {
    reset(initialValues ?? { name: "", durationMinutes: 30, price: 0, isActive: true });
  }, [initialValues, reset]);

  function submitHandler(values) {
    onSubmit({
      name: values.name.trim(),
      durationMinutes: Number(values.durationMinutes),
      price: Number(values.price),
      isActive: Boolean(values.isActive)
    });
  }

  return (
    <form className="service-form" onSubmit={handleSubmit(submitHandler)}>
      <Input
        label="Hizmet adı"
        placeholder="Örn. Saç Kesimi"
        error={errors.name?.message}
        {...register("name", { required: "Hizmet adı zorunludur", maxLength: { value: 60, message: "En fazla 60 karakter" } })}
      />
      <Input
        label="Süre (dakika)"
        type="number"
        min={5}
        step={5}
        error={errors.durationMinutes?.message}
        {...register("durationMinutes", {
          required: "Süre zorunludur", valueAsNumber: true,
          min: { value: 5, message: "En az 5 dakika" }, max: { value: 480, message: "En fazla 480 dakika" }
        })}
      />
      <Input
        label="Ücret (₺)"
        type="number"
        min={0}
        step={10}
        error={errors.price?.message}
        {...register("price", {
          required: "Ücret zorunludur", valueAsNumber: true,
          min: { value: 0, message: "Negatif olamaz" }, max: { value: 100000, message: "Çok yüksek" }
        })}
      />

      {/* Aktif / Pasif */}
      <label className="service-form__toggle">
        <input type="checkbox" {...register("isActive")} />
        <span>Hizmet aktif (müşterilere gösterilsin)</span>
      </label>

      <div className="service-form__actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
