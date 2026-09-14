import { ChevronLeft, ChevronRight } from "lucide-react";
import Select from "./Select";

function getVisiblePages(page, pageCount) {
  const count = Math.min(Math.max(Number(pageCount) || 1, 1), 5);
  const lastStart = Math.max(1, pageCount - count + 1);
  const start = Math.min(Math.max(1, page - Math.floor(count / 2)), lastStart);
  return Array.from({ length: count }, (_, index) => start + index);
}

export default function TablePagination({
  page,
  pageCount,
  pageSize,
  total,
  start,
  end,
  loading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
}) {
  const safePageCount = Math.max(Number(pageCount) || 1, 1);
  const safePage = Math.min(Math.max(Number(page) || 1, 1), safePageCount);
  const pages = getVisiblePages(safePage, safePageCount);
  const options = pageSizeOptions.map(value => typeof value === "object" ? value : ({ value, label: `${value} / Halaman` }));

  return <footer className="grid min-h-[76px] shrink-0 grid-cols-2 items-center gap-x-3 gap-y-4 border-t border-slate-200 bg-slate-50/50 px-4 py-4 text-xs text-slate-500 dark:border-slate-700 sm:grid-cols-3 sm:px-5">
    <span className="min-w-0 leading-5">Menampilkan <b className="text-slate-700 dark:text-slate-200">{total ? `${start}-${end}` : "0"}</b> dari {total} data</span>
    <nav aria-label="Navigasi halaman tabel" className="col-span-2 row-start-2 flex min-w-0 items-center justify-center gap-1 sm:col-span-1 sm:row-start-auto sm:gap-1.5">
      <button type="button" aria-label="Halaman sebelumnya" disabled={safePage <= 1 || loading} onClick={() => onPageChange(safePage - 1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
      {pages.map(number => <button type="button" key={number} aria-label={`Halaman ${number}`} aria-current={safePage === number ? "page" : undefined} disabled={loading} onClick={() => onPageChange(number)} className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-semibold ${safePage === number ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800"}`}>{number}</button>)}
      <button type="button" aria-label="Halaman berikutnya" disabled={safePage >= safePageCount || loading} onClick={() => onPageChange(safePage + 1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
    </nav>
    <div className="flex min-w-0 justify-end"><Select value={pageSize} onChange={value => onPageSizeChange(Number(value))} ariaLabel="Jumlah data per halaman" placement="top" className="w-full max-w-40" options={options} /></div>
  </footer>;
}
