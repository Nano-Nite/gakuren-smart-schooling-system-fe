import ExpandableBadges from "./ExpandableBadges";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, RefreshCw, Search } from "lucide-react";
import { getTitleOptions, formatIndonesianAcademicName } from "../utils/titleOptions";
import { uniqueTitleLabels } from "../utils/academicTitleDisplay";

const normalizeTitleSearch = value => String(value ?? "").replace(/[.,]/g, "").trim().toLocaleLowerCase("id");

export default function TitleSelector({ prefixValues = [], suffixValues = [], onChange, previewName = "" }) {
  const rootRef = useRef(null);
  const triggerRefs = useRef({});
  const menuRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [enabled, setEnabled] = useState(() => prefixValues.length > 0 || suffixValues.length > 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuStyle, setMenuStyle] = useState({});
  const [search, setSearch] = useState("");
  const selectedIds = [...prefixValues, ...suffixValues].join(",");

  const updateMenuPosition = () => {
    const rect = triggerRefs.current[open]?.getBoundingClientRect();
    if (!rect) return;
    const width = rect.width;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openAbove = spaceBelow < 224 && spaceAbove > spaceBelow;
    setMenuStyle(openAbove ? { bottom: window.innerHeight - rect.top + 6, left: rect.left, right: window.innerWidth - rect.right, boxSizing: "border-box", maxHeight: Math.max(120, spaceAbove - 6) } : { top: rect.bottom + 6, left: rect.left, right: window.innerWidth - rect.right, boxSizing: "border-box", maxHeight: Math.max(120, spaceBelow - 6) });
  };
  useEffect(() => {
    const close = event => { if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(null); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => { if (prefixValues.length || suffixValues.length) setEnabled(true); }, [prefixValues.length, suffixValues.length]);
  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    setLoading(options.length === 0);
    getTitleOptions({ requiredIds: selectedIds ? selectedIds.split(",") : [], forceRefresh: refreshKey > 0, signal: controller.signal }).then(items => { if (!controller.signal.aborted) { setOptions(items); setError(""); } }).catch(requestError => { if (requestError.name !== "AbortError") setError("Gagal memuat data gelar. Periksa koneksi atau akses Anda."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [enabled, refreshKey, selectedIds]);
  useLayoutEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => { window.removeEventListener("resize", updateMenuPosition); window.removeEventListener("scroll", updateMenuPosition, true); };
  }, [open]);

  const renderGroup = (type, label, values) => {
    const group = options.filter(option => option.isPrefix === (type === "prefix"));
    const query = normalizeTitleSearch(search);
    const filtered = group.filter(option => normalizeTitleSearch(`${option.label} ${option.name}`).includes(query));
    const selected = group.filter(option => values.includes(option.value));
    const selectedLabels = uniqueTitleLabels(selected.map(option => option.label));
    const toggle = option => {
      const nextValues = values.includes(option.value) ? values.filter(value => value !== option.value) : [...values, option.value];
      onChange(type, nextValues, group.filter(item => nextValues.includes(item.value)).sort((a, b) => a.sequence - b.sequence || a.name.localeCompare(b.name, "id")).map(item => item.label));
    };
    const menu = open === type && menuStyle.left !== undefined && createPortal(<div ref={menuRef} style={menuStyle} onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(null); triggerRefs.current[type]?.focus(); }
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        const items = [...event.currentTarget.querySelectorAll('[data-title-option]')];
        const current = items.indexOf(document.activeElement);
        const next = event.key === "ArrowDown" ? (current + 1) % items.length : current <= 0 ? items.length - 1 : current - 1;
        items[next]?.focus();
      }
    }} className="fixed z-[100] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-[fadeUp_150ms_ease-out]">
      <div className="sticky -top-1.5 z-10 bg-white pb-2 pt-1"><label className="relative block"><Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input autoFocus type="search" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }} aria-label={`Cari ${label.toLowerCase()}`} placeholder="Cari nama atau singkatan gelar" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-white/20 dark:bg-slate-900 dark:text-slate-100" /></label><p className="px-1 pt-2 text-xs text-slate-500">{filtered.length} gelar tersedia. Bisa pilih lebih dari satu.</p></div>
      {!filtered.length && <p role="status" className="px-3 py-5 text-center text-sm text-slate-500">Tidak ada gelar yang cocok. Coba kata kunci lain.</p>}
      {filtered.map(option => <button key={option.value} data-title-option type="button" aria-pressed={values.includes(option.value)} onClick={() => toggle(option)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${values.includes(option.value) ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}><span><span className="block">{option.label}</span><span className="text-xs font-normal text-slate-400">{option.name}</span></span>{values.includes(option.value) && <Check className="h-4 w-4" />}</button>)}
  </div>, document.body);
    return <div className="relative"><span className="mb-2 block text-sm font-semibold">{label} <span className="font-normal text-slate-400">(opsional)</span></span><div ref={element => { triggerRefs.current[type] = element; }} role="button" tabIndex={0} onKeyDown={event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); event.currentTarget.click(); } }} aria-expanded={open === type} aria-label={`Pilih ${label.toLowerCase()}`} onClick={() => { setSearch(""); setOpen(current => current === type ? null : type); }} title={selectedLabels.join(", ")} className="flex min-h-10 py-2 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm hover:border-blue-300"><span className="flex min-w-0 flex-1 items-center gap-1.5">{selected.length ? <ExpandableBadges limit={1} items={selectedLabels} /> : <span data-placeholder="true" className="truncate text-slate-400">Pilih {label.toLowerCase()}</span>}</span><ChevronDown className="h-4 w-4 shrink-0 text-slate-500" /></div>{menu}</div>;
  };

  const prefixLabels = options.filter(option => prefixValues.includes(option.value)).sort((a, b) => a.sequence - b.sequence).map(option => option.label);
  const suffixLabels = options.filter(option => suffixValues.includes(option.value)).sort((a, b) => a.sequence - b.sequence).map(option => option.label);
  const toggleEnabled = () => { const next = !enabled; setEnabled(next); setOpen(null); if (!next) { onChange("prefix", [], []); onChange("suffix", [], []); } };

  return <div ref={rootRef} className="sm:col-span-2"><label className="checkbox-label group inline-flex cursor-pointer select-none items-center gap-2.5 text-sm"><input type="checkbox" checked={enabled} onChange={toggleEnabled} className="peer sr-only" /><span className="remember-box" aria-hidden="true" /><span className="font-medium transition-transform duration-200 group-active:translate-x-0.5">Tambahkan gelar akademik</span></label>{enabled && <div className="mt-5">{loading ? <div className="flex h-12 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Memuat gelar...</div> : error || !options.length ? <button type="button" aria-label="Muat ulang data gelar" onClick={() => { setLoading(true); setRefreshKey(value => value + 1); }} className="flex h-12 w-full items-center justify-between rounded-lg border border-rose-200 px-3.5 text-sm text-rose-600"><span>{error || "Data gelar tidak ditemukan."}</span><RefreshCw className="h-4 w-4 shrink-0" /></button> : <><div className="grid gap-5 sm:grid-cols-2">{renderGroup("prefix", "Gelar depan", prefixValues)}{renderGroup("suffix", "Gelar belakang", suffixValues)}</div><div className="mt-5 rounded-lg bg-blue-50 px-3.5 py-3 text-sm"><span className="text-xs text-slate-500">Pratinjau nama dengan gelar</span><b className="mt-1 block">{formatIndonesianAcademicName(previewName, prefixLabels, suffixLabels) || "-"}</b></div></>}</div>}</div>;
}
