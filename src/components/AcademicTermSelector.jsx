import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getAutomaticAcademicTerm, isValidAcademicTerm, readAcademicTermOverride } from "../utils/academicTerm";

export default function AcademicTermSelector({ storageKey }) {
  const id = useId();
  const [automatic, setAutomatic] = useState(getAutomaticAcademicTerm);
  const [override, setOverride] = useState(() => readAcademicTermOverride(localStorage, storageKey));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(override || automatic);
  const [error, setError] = useState("");
  const term = override || automatic;

  useEffect(() => {
    const refresh = () => setAutomatic(getAutomaticAcademicTerm());
    const sync = event => { if (event.key === storageKey || event.key === null) setOverride(readAcademicTermOverride(localStorage, storageKey)); };
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", sync);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); window.removeEventListener("storage", sync); };
  }, [storageKey]);

  const save = value => {
    if (value && !isValidAcademicTerm(value)) { setError("Masukkan tahun awal antara 1900–9998."); return; }
    try {
      if (value) localStorage.setItem(storageKey, JSON.stringify(value));
      else localStorage.removeItem(storageKey);
      setOverride(value);
      setAutomatic(getAutomaticAcademicTerm());
      setError("");
      setEditing(false);
    } catch { setError("Pengaturan gagal disimpan di browser. Silakan coba lagi."); }
  };

  return <div className="p-3">
    <button type="button" aria-expanded={editing} aria-controls={id} onClick={() => { setDraft(term); setError(""); setEditing(value => !value); }} className="flex min-h-11 w-full items-center justify-between gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <span><span className="block text-[10px] text-slate-500">Tahun Ajaran · {override ? "Manual" : "Otomatis"}</span><span className="mt-1 block whitespace-nowrap text-xs font-semibold text-blue-600 dark:text-blue-300">{term.startYear}/{term.startYear + 1} - {term.semester}</span></span>
      <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${editing ? "" : "rotate-180"}`} />
    </button>
    {editing && <div id={id} className="mt-3 space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
      <label className="block text-xs text-slate-600 dark:text-slate-300">Tahun awal
        <input type="number" min="1900" max="9998" step="1" value={draft.startYear} onChange={event => setDraft(value => ({ ...value, startYear: event.target.value === "" ? "" : Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent" />
      </label>
      <label className="block text-xs text-slate-600 dark:text-slate-300">Semester
        <select value={draft.semester} onChange={event => setDraft(value => ({ ...value, semester: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[var(--mui-paper)]"><option>Ganjil</option><option>Genap</option></select>
      </label>
      <p className="text-[11px] leading-4 text-slate-500">Otomatis: Ganjil mulai Juli, Genap mulai Januari. Pilihan manual berlaku di browser ini.</p>
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => save({ ...draft, startYear: Number(draft.startYear) })} className="min-h-10 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white">Simpan</button><button type="button" onClick={() => save(null)} className="min-h-10 rounded-lg px-2 text-xs font-medium text-blue-600 dark:text-blue-300">Gunakan otomatis</button></div>
    </div>}
  </div>;
}
