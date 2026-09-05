import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createPortal } from "react-dom";
import { Settings } from "lucide-react";

const AuthSplash = forwardRef(function AuthSplash({ open }, ref) {
  const overlayRef = useRef(null);
  const exitAnimationRef = useRef(null);
  useImperativeHandle(ref, () => ({
    fadeOut: async () => {
      if (!overlayRef.current) return;
      if (!exitAnimationRef.current) {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const blur = getComputedStyle(overlayRef.current).getPropertyValue("--auth-splash-blur").trim() || "12px";
        exitAnimationRef.current = overlayRef.current.animate(
          [
            { opacity: 1, backdropFilter: `blur(${blur})`, webkitBackdropFilter: `blur(${blur})` },
            { opacity: 0, backdropFilter: "blur(0px)", webkitBackdropFilter: "blur(0px)" },
          ],
          { duration: reducedMotion ? 100 : 3000, easing: "ease-in-out", fill: "forwards" },
        );
      }
      try { await exitAnimationRef.current.finished; } catch { /* The splash was unmounted. */ }
    },
  }), []);

  useEffect(() => {
    if (!open) return undefined;
    const root = document.getElementById("root");
    const previousInert = root?.inert;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = "hidden";
    overlayRef.current?.focus({ preventScroll: true });
    return () => {
      exitAnimationRef.current?.cancel();
      exitAnimationRef.current = null;
      if (root) root.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return createPortal(<div ref={overlayRef} role="dialog" aria-modal="true" aria-label="Memuat data" tabIndex={-1} onKeyDown={event => { if (event.key === "Tab") event.preventDefault(); }} className="auth-splash fixed inset-0 z-[300] grid place-items-center bg-white/25 outline-none dark:bg-slate-950/60">
    <div className="flex flex-col items-center gap-6 px-6 text-center">
      <div className="relative isolate">
        <span aria-hidden="true" className="auth-splash-logo-glow pointer-events-none absolute -inset-8 z-0 rounded-full" />
        <img src="/favicon.svg" alt="Logo Gakuren" className="relative z-10 h-24 w-24 rounded-2xl shadow-lg sm:h-28 sm:w-28" />
      </div>
      <div role="status" aria-live="polite" className="flex items-center gap-3 text-base font-semibold text-slate-700 dark:text-slate-200">
        <span>Memuat data</span><Settings aria-hidden="true" className="auth-splash-gear h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
      </div>
    </div>
  </div>, document.body);
});

export default AuthSplash;
