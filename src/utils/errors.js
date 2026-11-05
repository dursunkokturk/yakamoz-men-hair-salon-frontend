export const ERROR_MESSAGES_TR = {
  SLOT_FULL: "Bu saat dolu, lütfen başka bir saat seçin",
  DATE_CLOSED: "İşletme bu tarihte kapalı",
  PAST_DATE: "Geçmiş bir saate randevu alınamaz",
  TOO_MANY_APPOINTMENTS: "En fazla 3 aktif randevunuz olabilir",
  BLOCKED: "Bu bilgilerle randevu oluşturulamıyor. Lütfen berberle iletişime geçin.",
  INVALID_INPUT: "Girdiğiniz bilgiler geçersiz, lütfen kontrol edin",
  INVALID_SERVICE: "Girdiğiniz bilgiler geçersiz, lütfen kontrol edin",
  FORBIDDEN: "Bu işlem için yetkiniz yok",
};
export const errorMessage = (err, fallback) => ERROR_MESSAGES_TR[err?.message] ?? fallback;