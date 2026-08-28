export default function PageSkeleton() {
  return <div role="status" aria-label="Memuat halaman" className="animate-pulse p-4 sm:p-6">
    <span className="sr-only">Memuat halaman...</span>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map(item => <div key={item} className="flex h-28 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"><div className="h-14 w-14 rounded-xl bg-slate-200" /><div className="flex-1 space-y-3"><div className="h-3 w-2/3 rounded bg-slate-200" /><div className="h-7 w-1/3 rounded bg-slate-200" /></div></div>)}
    </div>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-4"><div className="h-4 w-40 rounded bg-slate-200" /><div className="h-8 w-24 rounded bg-slate-200" /></div>
      <div className="space-y-0">{Array.from({ length: 7 }, (_, index) => <div key={index} className="grid grid-cols-4 gap-5 border-b border-slate-100 p-4"><div className="h-3 rounded bg-slate-200" /><div className="h-3 rounded bg-slate-200" /><div className="h-3 rounded bg-slate-200" /><div className="h-3 rounded bg-slate-200" /></div>)}</div>
    </div>
  </div>;
}
