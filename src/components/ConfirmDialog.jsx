import { useEffect, useId } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({ open, title = "Konfirmasi tindakan", description, confirmLabel = "Hapus", cancelLabel = "Batal", tone = "danger", onConfirm, onCancel }) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = event => event.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;
  const danger = tone === "danger";

  return <div className="fixed inset-0 z-[60] grid place-items-center p-4">
    <button type="button" aria-label="Tutup konfirmasi" onClick={onCancel} className="confirm-backdrop drawer-scrim no-action-animation absolute inset-0 backdrop-blur-[1px]" />
    <section role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="confirm-dialog relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <button type="button" aria-label="Tutup" onClick={onCancel} className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
      <div className="px-8 pb-6 pt-8 text-center">
        <div className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full ${danger ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}><AlertTriangle className="h-9 w-9" strokeWidth={2.2} /></div>
        <h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2>
        <p id={descriptionId} className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="action-lift rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">{cancelLabel}</button>
        <button type="button" autoFocus onClick={onConfirm} className={`action-lift rounded-lg px-5 py-2.5 text-sm font-semibold text-white ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"}`}>{confirmLabel}</button>
      </footer>
    </section>
  </div>;
}
