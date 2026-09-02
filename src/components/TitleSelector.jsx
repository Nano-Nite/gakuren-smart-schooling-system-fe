import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { getTitleOptions } from "../utils/titleOptions";
import { formatIndonesianAcademicName } from "../utils/titleOptions";

export default function TitleSelector({ prefixValues = [], suffixValues = [], onChange, previewName = "" }) {
  const rootRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [enabled, setEnabled] = useState(() => prefixValues.length > 0 || suffixValues.length > 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const close = event => { if (!rootRef.current?.contains(event.target)) setOpen(null); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    if (prefixValues.length || suffixValues.length) setEnabled(true);
  }, [prefixValues.length, suffixValues.length]);
  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    setLoading(true);
    getTitleOptions({ forceRefresh: refreshKey > 0, signal: controller.signal }).then(items => { setOptions(items); setError(""); }).catch(requestError => { if (requestError.name !== "AbortError") setError("Gagal memuat data gelar. Periksa koneksi atau akses Anda."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [enabled, refreshKey]);

  const renderGroup = (type, label, values) => {
    const group = options.filter(option => option.isPrefix === (type === "prefix"));
    const selected = group.filter(option => values.includes(option.value));
    const toggle = option => {
      const nextValues = values.includes(option.value) ? values.filter(value => value !== option.value) : [...values, option.value];
      onChange(type, nextValues, group.filter(item => nextValues.includes(item.value)).sort((a, b) => a.sequence - b.sequence || a.name.localeCompare(b.name, "id")).map(item => item.label));
    };
    return <div className="relative"><span className="mb-2 block text-sm font-semibold">{label} <span className="font-normal text-slate-400">(opsional)</span></span><button type="button" onClick={() => setOpen(current => current === type ? null : type)} className="flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-left text-sm hover:border-blue-300 dark:border-white/15"><span className="flex min-w-0 flex-1 flex-wrap gap-1.5">{selected.length ? selected.map(option => <span key={option.value} className="inline-flex rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">{option.label}</span>) : <span className="text-slate-400">Pilih {label.toLowerCase()}</span>}</span><ChevronDown className="h-4 w-4 shrink-0 text-slate-500" /></button>{open === type && <div className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/15">{group.map(option => <button key={option.value} type="button" onClick={() => toggle(option)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${values.includes(option.value) ? "bg-blue-50 font-semibold text-blue-700" : "hover:bg-slate-50"}`}><span><span className="block">{option.label}</span><span className="text-xs font-normal text-slate-400">{option.name}</span></span>{values.includes(option.value) && <Check className="h-4 w-4" />}</button>)}</div>}</div>;
  };

  const prefixLabels = options.filter(option => prefixValues.includes(option.value)).sort((a, b) => a.sequence - b.sequence).map(option => option.label);
  const suffixLabels = options.filter(option => suffixValues.includes(option.value)).sort((a, b) => a.sequence - b.sequence).map(option => option.label);
  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    setOpen(null);
    if (!next) { onChange("prefix", [], []); onChange("suffix", [], []); }
  };

  return <div ref={rootRef} className="sm:col-span-2"><label className="checkbox-label group inline-flex cursor-pointer select-none items-center gap-2.5 text-sm"><input type="checkbox" checked={enabled} onChange={toggleEnabled} className="peer sr-only" /><span className="remember-box" aria-hidden="true" /><span className="font-medium transition-transform duration-200 group-active:translate-x-0.5">Tambahkan gelar akademik</span></label>{enabled && <div className="mt-5">{loading ? <div className="flex h-12 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Memuat gelar…</div> : error || !options.length ? <button type="button" aria-label="Muat ulang data gelar" title="Muat ulang" onClick={() => { setLoading(true); setRefreshKey(value => value + 1); }} className="flex h-12 w-full items-center justify-between rounded-lg border border-rose-200 px-3.5 text-sm text-rose-600"><span>{error || "Data gelar tidak ditemukan."}</span><RefreshCw className="h-4 w-4 shrink-0" /></button> : <><div className="grid gap-5 sm:grid-cols-2">{renderGroup("prefix", "Gelar depan", prefixValues)}{renderGroup("suffix", "Gelar belakang", suffixValues)}</div><div className="mt-5 rounded-lg bg-blue-50 px-3.5 py-3 text-sm"><span className="text-xs text-slate-500">Pratinjau nama dengan gelar</span><b className="mt-1 block">{formatIndonesianAcademicName(previewName, prefixLabels, suffixLabels) || "-"}</b></div></>}</div>}</div>;
}
