import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { getEducationLevelOptions } from "../utils/educationLevelOptions";

export default function EducationLevelSelect({ value, error, onChange }) {
  const rootRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        setOptions(await getEducationLevelOptions({ forceRefresh: refreshKey > 0, signal: controller.signal }));
        setRequestError("");
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") { setOptions([]); setRequestError(fetchError.message); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [refreshKey]);

  const selected = options.find(option => String(option.value) === String(value));

  return <div ref={rootRef} className="education-level-select relative text-sm"><span className="mb-2 block font-semibold text-slate-800 dark:text-slate-200">Jenjang pendidikan <b className="text-rose-500">*</b></span>
    {loading ? <div className="flex h-12 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-slate-500 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" />Memuat jenjang…</div> : requestError ? <button type="button" onClick={() => setRefreshKey(value => value + 1)} className="flex h-12 w-full items-center justify-between rounded-lg border border-rose-300 px-3.5 text-left text-rose-600 dark:border-rose-500/50 dark:bg-slate-900/60 dark:text-rose-400"><span className="truncate">Gagal memuat data</span><RefreshCw className="h-4 w-4 shrink-0" /></button> : options.length ? <><button type="button" aria-label="Jenjang pendidikan" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)} className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 text-left hover:border-blue-300 dark:bg-slate-900/60 dark:hover:border-blue-500 ${error ? "border-rose-400 dark:border-rose-500" : "border-slate-300 dark:border-white/15"}`}><span className={selected ? "font-semibold text-slate-700 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}>{selected?.label || "Pilih jenjang"}</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${open ? "rotate-180" : ""}`} /></button>{open && <div role="listbox" className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/15 dark:bg-slate-900">{options.map(option => { const active = String(option.value) === String(value); return <button key={option.value} type="button" role="option" aria-selected={active} onClick={() => { onChange(option.value, option); setOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${active ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"}`}><span><span className="block">{option.label}</span>{option.name && option.name !== option.label && <span className="block text-xs font-normal text-slate-400 dark:text-slate-500">{option.name}</span>}</span>{active && <Check className="h-4 w-4 shrink-0" />}</button>; })}</div>}</> : <button type="button" onClick={() => setRefreshKey(value => value + 1)} className="flex h-12 w-full items-center justify-between rounded-lg border border-amber-300 px-3.5 text-left text-amber-700 dark:border-amber-500/50 dark:bg-slate-900/60 dark:text-amber-400"><span>Data tidak ditemukan.</span><RefreshCw className="h-4 w-4 shrink-0" /></button>}
    {error && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </div>;
}
