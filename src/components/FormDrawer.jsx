import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export default function FormDrawer({ open, title, onClose, onSubmit, children, submitLabel = "Simpan" }) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef(null);
  const retainedTitle = useRef(title);
  const retainedSubmitLabel = useRef(submitLabel);

  // Keep the current drawer identity while its closing animation is running.
  // Parents commonly clear their edit/create state as soon as close is pressed.
  if (open) {
    retainedTitle.current = title;
    retainedSubmitLabel.current = submitLabel;
  }

  useEffect(() => {
    let removalTimer;

    if (open) {
      setRendered(true);
      setVisible(true);
    } else {
      setVisible(false);
      removalTimer = window.setTimeout(() => setRendered(false), 520);
    }

    return () => {
      window.clearTimeout(removalTimer);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!rendered || !open || !panelRef.current) return undefined;
    const animation = panelRef.current.animate(
      [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
      { duration: 500, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    );
    return () => animation.cancel();
  }, [rendered, open]);

  useEffect(() => {
    if (!rendered) return undefined;
    const handleKeyDown = event => event.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Tutup formulir" onClick={onClose} className={`drawer-backdrop drawer-scrim no-action-animation absolute inset-0 backdrop-blur-sm ${visible ? "is-visible" : ""}`} />
      <form ref={panelRef} onSubmit={onSubmit} className={`drawer-panel relative flex h-full w-full flex-col bg-white shadow-2xl sm:w-2/3 ${visible ? "is-visible" : ""}`}>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5 sm:px-7">
          <h2 className="text-lg font-bold">{retainedTitle.current}</h2>
          <button type="button" aria-label="Tutup" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">{children}</div>
        <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
          <button type="button" onClick={onClose} className="action-lift rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
          <button type="submit" className="action-lift rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">{retainedSubmitLabel.current}</button>
        </footer>
      </form>
    </div>
  );
}
