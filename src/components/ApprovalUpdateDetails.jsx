export default function ApprovalUpdateDetails({ rows, canCompare, renderValue }) {
  const changed = rows.filter(row => row.changed);
  const unchanged = rows.filter(row => !row.changed);
  const renderRows = items => <dl className="divide-y divide-slate-100 dark:divide-white/10">{items.map((row, index) => <div key={row.key} className="py-3">
    {row.group && items[index - 1]?.group !== row.group && <dt className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{row.group}</dt>}
    <dt className="mb-1 text-xs text-slate-500">{row.label}{row.changed && <span className="sr-only"> — Berubah</span>}</dt>
    <dd className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800 dark:text-slate-100">
      {canCompare && row.changed ? <div className="space-y-2">
        <div className="min-w-0 text-slate-500 dark:text-slate-400"><span className="mb-0.5 block text-[11px]">Saat ini</span>{renderValue(row.current, row.key)}</div>
        <div className="min-w-0 font-medium text-orange-700 dark:text-orange-300"><span className="mb-0.5 block text-[11px] font-normal"><span aria-hidden="true">→ </span>Diajukan</span>{renderValue(row.value, row.key)}</div>
      </div> : renderValue(row.value, row.key)}
    </dd>
  </div>)}</dl>;
  if (!rows.length) return <p className="text-sm text-slate-500">Tidak ada data permintaan.</p>;
  return <div>{canCompare ? <>
    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{changed.length ? `${changed.length} data berubah` : "Tidak ada perubahan data terdeteksi"}</p>
    {renderRows(changed)}
    {unchanged.length > 0 && <details className="mt-3 border-t border-slate-200 pt-3 dark:border-white/15">
      <summary className="cursor-pointer rounded py-2 text-sm font-medium text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Data lainnya ({unchanged.length} tidak berubah)</summary>
      {renderRows(unchanged)}
    </details>}
  </> : renderRows(rows)}</div>;
}
