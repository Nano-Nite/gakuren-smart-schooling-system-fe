import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { getDailyReference } from "../utils/dailyReferenceCache";

export default function SubjectSelector({ values = [], onChange }) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const id = useId();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuStyle, setMenuStyle] = useState({});

  const updateMenuPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = rect.width;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openAbove = spaceBelow < 224 && spaceAbove > spaceBelow;
    setMenuStyle(openAbove
      ? { bottom: window.innerHeight - rect.top + 6, left: rect.left, right: window.innerWidth - rect.right, boxSizing: "border-box", maxHeight: Math.max(120, spaceAbove - 6) }
      : { top: rect.bottom + 6, left: rect.left, right: window.innerWidth - rect.right, boxSizing: "border-box", maxHeight: Math.max(120, spaceBelow - 6) });
  };

  useEffect(() => {
    const close = event => { if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => { window.removeEventListener("resize", updateMenuPosition); window.removeEventListener("scroll", updateMenuPosition, true); };
  }, [open]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setOptions([]);
    setRequestError("");
    const load = async () => {
      try {
        const response = await getDailyReference("subject", { forceRefresh: refreshKey > 0, signal: controller.signal });
        if (controller.signal.aborted) return;
        setOptions([...new Map(response.result.filter(item => item.uuid && item.name).map(item => [item.uuid, item])).values()]);
      } catch (error) {
        if (!controller.signal.aborted) setRequestError("Gagal memuat mata pelajaran. Silakan coba lagi.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [refreshKey]);

  const toggle = option => {
    const next = values.includes(option.uuid) ? values.filter(value => value !== option.uuid) : [...values, option.uuid];
    onChange(next, next.map(value => options.find(item => item.uuid === value)?.name).filter(Boolean));
  };

  return <div ref={rootRef} className="relative min-w-0 text-sm" onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
  }}>
    <span id={`${id}-label`} className="mb-2 block font-semibold">Mata pelajaran <span className="font-normal text-slate-400">(opsional)</span></span>
    <button ref={triggerRef} type="button" disabled={loading || Boolean(requestError) || !options.length} aria-labelledby={`${id}-label`} aria-expanded={open} aria-controls={`${id}-options`} onClick={() => { updateMenuPosition(); setOpen(current => !current); }} className="flex h-12 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-700 shadow-sm hover:border-blue-300 disabled:opacity-60">
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {loading ? <span className="flex items-center gap-2 text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" />Memuat mata pelajaran...</span> : values.length ? <><span className="truncate rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">{options.find(item => item.uuid === values[0])?.name || values[0]}</span>{values.length > 1 && <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">+{values.length - 1} lainnya</span>}</> : <span data-placeholder="true" className="text-slate-400">Pilih mata pelajaran</span>}
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
    </button>
    {open && menuStyle.left !== undefined && createPortal(<div ref={menuRef} id={`${id}-options`} role="group" aria-labelledby={`${id}-label`} style={menuStyle} className="fixed z-[100] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-[fadeUp_150ms_ease-out]">
      {options.map(option => <button key={option.uuid} type="button" aria-pressed={values.includes(option.uuid)} onClick={() => toggle(option)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${values.includes(option.uuid) ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}><span><span className="block">{option.name}</span><span className="text-xs font-normal text-slate-400">{option.abbr_name}</span></span>{values.includes(option.uuid) && <Check className="h-4 w-4 shrink-0" />}</button>)}
    </div>, document.body)}
    {!loading && (requestError || !options.length) && <button type="button" onClick={() => setRefreshKey(value => value + 1)} className="mt-1.5 flex items-center gap-2 text-xs text-rose-600"><RefreshCw className="h-3.5 w-3.5" />{requestError || "Data mata pelajaran tidak ditemukan. Muat ulang."}</button>}
  </div>;
}