import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { getDailyReference } from "../utils/dailyReferenceCache";

export default function PositionSelector({ isStaff, values = [], onChange, error }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const id = useId();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const close = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setOptions([]);
    setRequestError("");
    setOpen(false);
    const load = async () => {
      try {
        const response = await getDailyReference("position", { isStaff, forceRefresh: refreshKey > 0, signal: controller.signal });
        if (controller.signal.aborted) return;
        const items = response.result;
        setOptions([...new Map(items.filter(item => item.uuid && item.name && item.is_staff === isStaff && String(item.status).toLowerCase() === "active").map(item => [item.uuid, item])).values()]);
      } catch (err) {
        if (!controller.signal.aborted) setRequestError("Gagal memuat data jabatan. Silakan coba lagi.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [isStaff, refreshKey]);

  const toggle = option => {
    const next = values.includes(option.uuid) ? values.filter(value => value !== option.uuid) : [...values, option.uuid];
    onChange(next, next.map(value => options.find(item => item.uuid === value)?.name).filter(Boolean));
  };

  return <div ref={rootRef} className="relative min-w-0 text-sm" onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); }
  }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <span id={`${id}-label`} className="mb-2 block font-semibold">Jabatan <b className="text-rose-500">*</b></span>
    <button ref={triggerRef} type="button" disabled={loading || Boolean(requestError) || !options.length} aria-labelledby={`${id}-label`} aria-expanded={open} aria-controls={`${id}-options`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onClick={() => setOpen(current => !current)} className={`flex h-12 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 py-2 text-left text-sm text-slate-700 shadow-sm focus-visible:border-blue-500 disabled:opacity-60 ${error ? "border-rose-400" : "border-slate-200 hover:border-blue-300"}`}>
      <span className="flex min-w-0 flex-1 items-center gap-1.5" title={values.map(value => options.find(item => item.uuid === value)?.name || value).join(", ")}>
        {loading ? <span className="flex min-w-0 items-center gap-2 text-slate-400"><RefreshCw className="h-4 w-4 shrink-0 animate-spin" /><span className="truncate">Memuat jabatan…</span></span> : values.length ? <><span className="truncate rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">{options.find(item => item.uuid === values[0])?.name || values[0]}</span>{values.length > 1 && <span className="shrink-0 whitespace-nowrap rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">+{values.length - 1} lainnya</span>}</> : <span className="truncate text-slate-400">Pilih jabatan</span>}
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
    </button>
    {open && <div id={`${id}-options`} role="group" aria-labelledby={`${id}-label`} className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      {options.map(option => <button key={option.uuid} type="button" aria-pressed={values.includes(option.uuid)} onClick={() => toggle(option)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${values.includes(option.uuid) ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}><span><span className="block">{option.name}</span><span className="text-xs font-normal text-slate-400">{option.abbr_name}</span></span>{values.includes(option.uuid) && <Check className="h-4 w-4 shrink-0" />}</button>)}
    </div>}
    {!loading && (requestError || !options.length) && <button type="button" onClick={() => setRefreshKey(value => value + 1)} className="mt-1.5 flex items-center gap-2 text-xs text-rose-600"><RefreshCw className="h-3.5 w-3.5 shrink-0" />{requestError || "Data jabatan tidak ditemukan. Muat ulang."}</button>}
    {error && <span id={`${id}-error`} role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </div>;
}
