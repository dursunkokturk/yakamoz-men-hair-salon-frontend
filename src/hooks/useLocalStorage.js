// Randevulari Listeleme

import { useEffect, useState } from "react";
import { loadFromStorage, saveToStorage } from "../utils/storage";

/** Tek bir localStorage anahtarına bağlı state; okuma başlangıçta, yazma her değişimde otomatik. */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => loadFromStorage(key, defaultValue));

  useEffect(() => {
    saveToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}