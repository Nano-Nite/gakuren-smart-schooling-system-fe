import { useEffect, useRef } from "react";

const Block = ({ className = "h-3 w-full" }) => <div className={`skeleton-block rounded bg-slate-200 dark:bg-white/10 ${className}`}><span className="skeleton-shimmer" /></div>;
const Panel = ({ children, className = "" }) => <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[var(--mui-paper)] ${className}`}>{children}</div>;
const Repeat = ({ count, children }) => Array.from({ length: count }, (_, index) => <div key={index}>{children(index)}</div>);

function TableSkeleton({ columns = 6, approval = false }) {
  return <Panel>
    {approval && <div className="flex gap-2 border-b border-slate-200 p-3 dark:border-white/10"><Repeat count={3}>{() => <Block className="h-10 w-28" />}</Repeat></div>}
    <div className="flex flex-col gap-3 border-b border-slate-200 p-3 md:flex-row md:justify-between lg:p-4 dark:border-white/10">
      <div className="flex min-w-0 gap-2"><Block className="h-10 w-10 shrink-0" /><Block className="h-10 w-44" /><Block className="h-10 w-32" /></div>
      {!approval && <div className="flex justify-end gap-2"><Block className="h-10 w-10" /><Block className="h-10 w-10" /><Block className="h-10 w-32" /></div>}
    </div>
    <div className="hidden md:block">
      <div className="grid gap-5 bg-slate-50 p-3 dark:bg-white/5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}><Repeat count={columns}>{() => <Block />}</Repeat></div>
      <Repeat count={7}>{() => <div className="grid gap-5 border-t border-slate-100 px-3 py-4 dark:border-white/5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}><Repeat count={columns}>{index => <Block className={index === columns - 1 ? "h-5 w-16" : "h-3 w-full"} />}</Repeat></div>}</Repeat>
    </div>
    <div className="divide-y divide-slate-100 md:hidden dark:divide-white/10"><Repeat count={5}>{() => <div className="flex justify-between gap-6 p-4"><div className="flex-1 space-y-3"><Block className="h-4 w-3/4" /><Block /><Block className="h-3 w-2/3" /></div><div className="space-y-3"><Block className="h-6 w-20" /><Block className="h-7 w-20" /></div></div>}</Repeat></div>
    <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 p-4 dark:border-white/10"><Block className="h-8 w-40" /><Block className="h-8 w-44" /></div>
  </Panel>;
}

function DashboardSkeleton() {
  return <div className="space-y-4"><Panel className="p-4"><Block className="mb-2 h-4 w-40" /><Block className="mb-4 h-3 w-28" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Repeat count={4}>{() => <div className="flex items-center gap-4 p-4"><Block className="h-12 w-12" /><div className="flex-1 space-y-3"><Block /><Block className="h-6 w-12" /></div></div>}</Repeat></div></Panel><TableSkeleton /></div>;
}

function ProfileSkeleton() {
  return <Panel><Block className="h-28 rounded-none" /><div className="px-5 pb-6 sm:px-8"><Block className="relative -mt-12 h-24 w-24 rounded-full border-4 border-white dark:border-slate-800" /><Block className="mt-4 h-6 w-48" /><Block className="mt-2 h-3 w-28" /><div className="mt-6 grid gap-3 sm:grid-cols-2"><Repeat count={4}>{() => <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5"><Block className="h-5 w-5" /><div className="flex-1 space-y-3"><Block className="h-3 w-24" /><Block /></div></div>}</Repeat></div></div></Panel>;
}

function QrSkeleton() {
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,.92fr)]"><Panel><div className="flex gap-2 border-b border-slate-200 p-2 dark:border-white/10"><Repeat count={3}>{() => <Block className="h-9 w-24" />}</Repeat></div><div className="min-h-[540px] space-y-6 p-5"><Block className="h-6 w-48" /><Block className="h-3 w-64 max-w-full" /><Repeat count={4}>{() => <div className="space-y-2"><Block className="h-3 w-28" /><Block className="h-12" /></div>}</Repeat><Block className="h-11" /></div></Panel><div className="space-y-5"><Panel className="space-y-4 p-4"><Block className="h-4 w-36" /><div className="grid grid-cols-2 gap-3"><Repeat count={4}>{() => <Block className="h-20" />}</Repeat></div></Panel><Panel className="p-4"><Block className="mb-6 h-4 w-36" /><Repeat count={4}>{() => <div className="flex gap-3 py-4"><Block className="h-9 w-9 rounded-full" /><div className="flex-1 space-y-3"><Block /><Block className="h-3 w-2/3" /></div></div>}</Repeat></Panel></div></div>;
}

export default function PageSkeleton({ pathname = "" }) {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animations = [];
    const start = () => {
      animations.forEach(animation => animation.cancel());
      animations = [...root.querySelectorAll(".skeleton-shimmer")].map(element => element.animate(
        [{ transform: "translateX(-100%)" }, { transform: "translateX(100%)" }],
        { duration: preference.matches ? 1800 : 1150, iterations: Infinity, delay: -350 },
      ));
    };
    start();
    preference.addEventListener("change", start);
    return () => { animations.forEach(animation => animation.cancel()); preference.removeEventListener("change", start); };
  }, [pathname]);
  const tableColumns = { "/classes": 6, "/students": 8, "/teachers": 8, "/approvals": 5 };
  const isPlaceholder = !tableColumns[pathname] && !["/dashboard", "/profile", "/qr-code"].includes(pathname);
  return <div ref={rootRef} role="status" aria-label="Memuat halaman" className={`page-skeleton p-4 sm:p-6 ${pathname === "/profile" ? "mx-auto max-w-4xl" : pathname === "/dashboard" || pathname === "/qr-code" ? "mx-auto max-w-[1680px]" : ""} ${isPlaceholder ? "grid min-h-full place-items-center" : ""}`}>
    <div aria-hidden="true" className={`w-full ${isPlaceholder ? "max-w-lg" : ""}`}>
      {tableColumns[pathname] ? <TableSkeleton columns={tableColumns[pathname]} approval={pathname === "/approvals"} /> : pathname === "/dashboard" ? <DashboardSkeleton /> : pathname === "/profile" ? <ProfileSkeleton /> : pathname === "/qr-code" ? <QrSkeleton /> : <Panel className="space-y-5 p-8"><Block className="mx-auto h-16 w-16 rounded-full" /><Block className="mx-auto h-6 w-40" /><Block /><Block className="mx-auto h-3 w-3/4" /></Panel>}
    </div>
  </div>;
}
