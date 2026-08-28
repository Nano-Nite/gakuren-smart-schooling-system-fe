import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import Select from "./Select";

export default function DataTable({ data, columns, getRowId = row => row.id, title, description, headerAction, renderMobileRow, emptyTitle = "Tidak ada data", emptyDescription = "Data yang Anda cari belum tersedia.", initialPageSize = 10 }) {
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const sorted = useMemo(() => {
    if (!sort) return data;
    return [...data].sort((a, b) => {
      const result = String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? ""), "id", { numeric: true });
      return sort.direction === "asc" ? result : -result;
    });
  }, [data, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visibleRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  const start = sorted.length ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, sorted.length);

  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const changeSort = key => setSort(current => ({ key, direction: current?.key === key && current.direction === "asc" ? "desc" : "asc" }));

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
    {(title || headerAction) && <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3"><div><h2 className="text-sm font-bold">{title}</h2>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</div>{headerAction}</header>}
    <div className="hidden md:block"><table className="w-full table-fixed text-left text-xs"><thead className="bg-slate-100/80"><tr>{columns.map(column => <th key={column.key} className={`px-3 py-3 font-medium ${column.width || ""} ${column.hideAt || ""}`}>{column.sortable === false ? column.label : <button onClick={() => changeSort(column.key)} className="group flex max-w-full items-center gap-1 hover:text-blue-600"><span className="truncate">{column.label}</span><ArrowDownUp className={`h-3 w-3 shrink-0 ${sort?.key === column.key ? "text-blue-600 opacity-100" : "opacity-0 group-hover:opacity-60"}`} /></button>}</th>)}</tr></thead><tbody>{visibleRows.map(row => <tr key={getRowId(row)} className="border-t border-slate-100 transition hover:bg-blue-50/50">{columns.map(column => <td key={column.key} className={`truncate px-3 py-3 ${column.cellClass || ""} ${column.hideAt || ""}`} title={column.title?.(row)}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>
    <div className="divide-y divide-slate-100 md:hidden">{visibleRows.map(row => <div key={getRowId(row)}>{renderMobileRow ? renderMobileRow(row) : <article className="p-4">{columns.filter(column => !column.mobileHidden).map(column => <div key={column.key} className="flex justify-between gap-4 py-1"><span className="text-xs text-slate-500">{column.label}</span><span className="text-right text-sm">{column.render ? column.render(row) : row[column.key]}</span></div>)}</article>}</div>)}</div>
    {!visibleRows.length && <div className="grid place-items-center px-4 py-14 text-center"><Inbox className="h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">{emptyTitle}</p><p className="mt-1 text-xs text-slate-500">{emptyDescription}</p></div>}
    <footer className="grid min-h-[72px] gap-4 border-t border-slate-200 bg-slate-50/50 px-5 py-4 text-xs text-slate-500 sm:grid-cols-3 sm:items-center"><span>Menampilkan <b className="text-slate-700">{start}-{end}</b> dari {sorted.length} data</span><div className="flex items-center justify-center gap-1.5"><button disabled={page === 1} onClick={() => setPage(value => value - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>{Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1).map(number => <button key={number} onClick={() => setPage(number)} className={`h-9 w-9 rounded-lg font-semibold ${page === number ? "bg-blue-600 text-white" : "border border-slate-200 bg-white"}`}>{number}</button>)}<button disabled={page === pageCount} onClick={() => setPage(value => value + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div><div className="flex justify-end"><Select value={pageSize} onChange={value => { setPageSize(Number(value)); setPage(1); }} ariaLabel="Jumlah data per halaman" placement="top" className="w-36 sm:w-40" options={[{ value: 10, label: "10 / Halaman" }, { value: 25, label: "25 / Halaman" }, { value: 50, label: "50 / Halaman" }]} /></div></footer>
  </section>;
}
