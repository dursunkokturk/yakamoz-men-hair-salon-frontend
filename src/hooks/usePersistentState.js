import { useEffect, useRef, useState } from "react";
import { saveToStorage } from "../utils/storage";

export function usePersistentState(key, init) {
  const [value, setValue] = useState(init);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    const t = setTimeout(() => saveToStorage(key, value), 300);
    return () => clearTimeout(t);
  }, [key, value]);

  useEffect(() => {
    const flush = () => saveToStorage(key, latest.current);
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, [key]);

  return [value, setValue];
}