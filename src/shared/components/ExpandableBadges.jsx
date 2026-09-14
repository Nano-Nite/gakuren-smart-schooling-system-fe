import { useState } from "react";

export default function ExpandableBadges({ items, limit = 3 }) {
  const [expanded, setExpanded] = useState(false);
  return <span className="flex min-w-0 flex-wrap items-center gap-1.5 whitespace-normal">
    {(expanded ? items : items.slice(0, limit)).map((item, index) => <span key={`${item}-${index}`} className="max-w-full break-words rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold leading-5 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200 [overflow-wrap:anywhere]">{item}</span>)}
    {items.length > limit && <button type="button" aria-expanded={expanded} aria-label={expanded ? "Ringkas daftar" : `Tampilkan ${items.length - limit} lainnya`} onKeyDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setExpanded(value => !value); }} className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold leading-5 text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">{expanded ? "Ringkas" : `+${items.length - limit}`}</button>}
  </span>;
}
