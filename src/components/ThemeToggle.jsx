import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return <button type="button" onClick={toggleTheme} aria-label={dark ? "Gunakan tema terang" : "Gunakan tema gelap"} title={dark ? "Tema terang" : "Tema gelap"} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600 ${className}`}>{dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</button>;
}
