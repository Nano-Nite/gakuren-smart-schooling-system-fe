import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Inbox } from "lucide-react";
import TablePagination from "./TablePagination";

export default function DataTable({ data, columns, getRowId = row => row.id, title, description, headerAction, renderMobileRow, emptyTitle = "Tidak ada data", emptyDescription = "Data yang Anda cari belum tersedia.", initialPageSize = 25 }) {
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
    <div className="divide-y divide-slate-100 md:hidden">{visibleRows.map(row => <div key={getRowId(row)} className="min-w-0">{renderMobileRow ? renderMobileRow(row) : <article className="min-w-0 p-4">{columns.filter(column => !column.mobileHidden).map(column => <div key={column.key} className="flex min-w-0 justify-between gap-4 py-1"><span className="shrink-0 text-xs text-slate-500">{column.label}</span><span className="min-w-0 break-words text-right text-sm">{column.render ? column.render(row) : row[column.key]}</span></div>)}</article>}</div>)}</div>
    {!visibleRows.length && <div className="grid place-items-center px-4 py-14 text-center"><Inbox className="h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">{emptyTitle}</p><p className="mt-1 text-xs text-slate-500">{emptyDescription}</p></div>}
    <TablePagination page={page} pageCount={pageCount} pageSize={pageSize} total={sorted.length} start={start} end={end} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} pageSizeOptions={[10, 25, 50]} />
  </section>;
}
