const ITERATIONS = 210_000; // hash'i bilerek yavaşlatır; saldırgan milyonlarca deneme yapamaz

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Her kullanıcı için rastgele tuz üretir */
export function generateSalt() {
  return toB64(crypto.getRandomValues(new Uint8Array(16)));
}

/** Şifre + tuz → hash. Tarayıcının kendi crypto kütüphanesini kullanır, ek paket gerekmez. */
export async function hashPassword(password, saltB64) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromB64(saltB64), iterations: ITERATIONS },
    key, 256
  );
  return toB64(bits);
}

/** İki yazıyı karşılaştırır, süre farkından bilgi sızdırmaz */
export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Tahmin edilemez ID: "apt-3f2a9c1e-..." */
export const newId = (prefix) => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex=Array.from(bytes,(b)=>b.toString(16).padStart(2,"0")).join("");
  return `${prefix}-${hex}`;
};