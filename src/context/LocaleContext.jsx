import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, translations } from "../i18n/translations";

const STORAGE_KEY = "gakuren:locale";
const LocaleContext = createContext(null);

const readPath = (source, path) => path.split(".").reduce((value, key) => value?.[key], source);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
  });

  const setLocale = nextLocale => {
    if (SUPPORTED_LOCALES.includes(nextLocale)) setLocaleState(nextLocale);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key, fallback = key) => readPath(translations[locale], key) ?? readPath(translations[DEFAULT_LOCALE], key) ?? fallback,
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale harus digunakan di dalam LocaleProvider");
  return context;
}
