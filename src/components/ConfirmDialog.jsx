import { useEffect, useId } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, X } from "lucide-react";

export default function ConfirmDialog({ open, title = "Konfirmasi tindakan", description, consequences = [], confirmLabel = "Hapus", cancelLabel = "Batal", tone = "danger", error, submitting = false, onConfirm, onCancel }) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = event => event.key === "Escape" && !submitting && onCancel();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, submitting]);

  if (!open) return null;
  const danger = tone === "danger";
  const success = tone === "success";
  const toneClasses = success ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" : danger ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400";
  const buttonClasses = success ? "bg-emerald-600 hover:bg-emerald-700" : danger ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700";

  return <div className="fixed inset-0 z-[60] grid place-items-center p-4">
    <button disabled={submitting} type="button" aria-label="Tutup konfirmasi" onClick={onCancel} className="confirm-backdrop drawer-scrim no-action-animation absolute inset-0 backdrop-blur-[1px]" />
    <section role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="confirm-dialog relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[var(--mui-paper)]">
      <button disabled={submitting} type="button" aria-label="Tutup" onClick={onCancel} className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/5 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
      <div className="px-6 pb-5 pt-6 text-left sm:px-7 sm:pt-7">
        <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${toneClasses}`}>{success ? <CheckCircle2 aria-hidden="true" className="h-6 w-6" strokeWidth={2.2} /> : <AlertTriangle aria-hidden="true" className="h-6 w-6" strokeWidth={2.2} />}</div>
        <h2 id={titleId} className="pr-6 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
        <p id={descriptionId} className="mt-2 break-words text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        {error && <p role="alert" className="mt-3 text-sm leading-6 text-rose-600 dark:text-rose-400">{error}</p>}
        {consequences.length > 0 && <details className="group mt-4 rounded-xl border border-slate-200 dark:border-white/10">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-white/5 [&::-webkit-details-marker]:hidden">
            Apa yang terjadi jika dinonaktifkan?
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <ul className="list-disc space-y-2 pb-4 pl-7 pr-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{consequences.map(text => <li key={text}>{text}</li>)}</ul>
        </details>}
      </div>
      <footer className="grid grid-cols-2 gap-3 px-6 pb-6 pt-1 sm:px-7 sm:pb-7">
        <button disabled={submitting} type="button" autoFocus onClick={onCancel} className="action-lift min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-white/15 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5 dark:focus-visible:ring-offset-slate-900">{cancelLabel}</button>
        <button disabled={submitting} type="button" onClick={onConfirm} className={`action-lift min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${buttonClasses}`}>{confirmLabel}</button>
      </footer>
    </section>
  </div>;
}
