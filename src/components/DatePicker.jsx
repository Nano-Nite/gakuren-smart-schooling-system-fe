import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Select from "./Select";

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const pad = value => String(value).padStart(2, "0");
const toDateValue = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = value => value ? new Date(`${value}T00:00:00`) : null;

export default function DatePicker({ value, onChange, label, error, required = false, min, max, placeholder = "Pilih tanggal", id, className = "" }) {
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const calendarRef = useRef(null);
  const selectedDate = parseDate(value);
  const maximumDate = parseDate(max);
  const minimumDate = parseDate(min);
  const initialDate = selectedDate || maximumDate || new Date();
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [calendarStyle, setCalendarStyle] = useState({});

  const updateCalendarPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(300, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const estimatedHeight = 390;
    const openAbove = window.innerHeight - rect.bottom < estimatedHeight && rect.top > window.innerHeight - rect.bottom;
    setCalendarStyle(openAbove
      ? { bottom: window.innerHeight - rect.top + 8, left, width }
      : { top: rect.bottom + 8, left, width });
  }, []);

  useEffect(() => {
    const close = event => { if (!rootRef.current?.contains(event.target) && !calendarRef.current?.contains(event.target) && !event.target.closest?.('[role="listbox"]')) setOpen(false); };
    const closeOnEscape = event => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updateCalendarPosition();
    window.addEventListener("resize", updateCalendarPosition);
    window.addEventListener("scroll", updateCalendarPosition, true);
    return () => { window.removeEventListener("resize", updateCalendarPosition); window.removeEventListener("scroll", updateCalendarPosition, true); };
  }, [open, updateCalendarPosition]);

  useEffect(() => {
    if (selectedDate) setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [value]);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const finalDay = new Date(year, month + 1, 0).getDate();
    const populatedDays = [...Array(firstDay).fill(null), ...Array.from({ length: finalDay }, (_, index) => new Date(year, month, index + 1))];
    return [...populatedDays, ...Array(42 - populatedDays.length).fill(null)];
  }, [viewDate]);

  const earliestYear = minimumDate?.getFullYear() ?? (maximumDate?.getFullYear() ?? new Date().getFullYear()) - 100;
  const latestYear = maximumDate?.getFullYear() ?? new Date().getFullYear() + 10;
  const yearOptions = Array.from({ length: latestYear - earliestYear + 1 }, (_, index) => latestYear - index).map(year => ({ value: year, label: String(year) }));
  const isDisabled = date => (minimumDate && date < minimumDate) || (maximumDate && date > maximumDate);
  const previousMonth = () => setViewDate(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  const nextMonthStart = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  const previousMonthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0);

  const calendar = open && <div ref={calendarRef} role="dialog" aria-label={label || "Pilih tanggal"} style={calendarStyle} className="fixed z-[100] rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/15 dark:bg-[#242424]">
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Bulan sebelumnya" disabled={minimumDate && previousMonthEnd < minimumDate} onClick={previousMonth} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 dark:border-white/15 dark:bg-[#2a2a2a] dark:text-white/80 dark:hover:bg-[#333333]"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
          <button type="button" aria-label="Bulan berikutnya" disabled={maximumDate && nextMonthStart > maximumDate} onClick={nextMonth} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 dark:border-white/15 dark:bg-[#2a2a2a] dark:text-white/80 dark:hover:bg-[#333333]"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
          <Select value={viewDate.getMonth()} onChange={month => setViewDate(current => new Date(current.getFullYear(), Number(month), 1))} ariaLabel="Pilih bulan" className="min-w-0" options={monthNames.map((month, index) => ({ value: index, label: month }))} />
          <Select value={viewDate.getFullYear()} onChange={year => setViewDate(current => new Date(Number(year), current.getMonth(), 1))} ariaLabel="Pilih tahun" className="min-w-0" options={yearOptions} />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">{weekDays.map(day => <span key={day} className="py-1 text-[11px] font-semibold text-slate-400 dark:text-white/45">{day}</span>)}{days.map((date, index) => date ? <button key={toDateValue(date)} type="button" disabled={isDisabled(date)} onClick={() => { onChange(toDateValue(date)); setOpen(false); }} className={`grid aspect-square place-items-center rounded-lg text-xs font-semibold transition disabled:cursor-not-allowed disabled:text-slate-300 dark:disabled:text-white/20 ${value === toDateValue(date) ? "bg-blue-600 text-white shadow-sm dark:bg-blue-400 dark:text-slate-950" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-blue-300"}`}>{date.getDate()}</button> : <span key={`empty-${index}`} className="aspect-square" />)}</div>
      {value && <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="mt-3 text-xs font-semibold text-rose-600 hover:text-rose-700">Hapus tanggal</button>}
    </div>;

  return <label ref={rootRef} className={`relative block text-sm ${className}`} htmlFor={id}>
    {label && <span className="mb-2 block font-semibold">{label}{required && <b className="text-rose-500"> *</b>}</span>}
    <button ref={buttonRef} id={id} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(current => !current)} className={`flex h-12 w-full items-center justify-between rounded-lg border bg-white px-3.5 text-left outline-none transition focus:ring-2 dark:bg-[#1e1e1e] ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-950" : "border-slate-300 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-100 dark:border-white/15 dark:hover:border-blue-400 dark:focus:ring-blue-950"}`}>
      <span className={value ? "text-slate-700 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}>{selectedDate ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(selectedDate) : placeholder}</span>
      <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
    </button>
    {calendar && createPortal(calendar, document.body)}
    {error && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </label>;
}
