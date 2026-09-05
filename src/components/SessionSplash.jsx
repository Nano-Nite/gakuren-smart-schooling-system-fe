import { useEffect, useRef } from "react";
import { ArrowRight, LoaderCircle, RefreshCw, WifiOff } from "lucide-react";

export default function SessionSplash({ failed, onRetry, onLogin }) {
  const headingRef = useRef(null);

  useEffect(() => {
    if (failed) headingRef.current?.focus({ preventScroll: true });
  }, [failed]);

  return <main aria-busy={!failed} className="fixed inset-0 z-[300] flex min-h-dvh flex-col overflow-y-auto bg-slate-50 text-slate-900 dark:bg-[#0b1220] dark:text-slate-100">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-600/10" />
      <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-600/10" />
    </div>

    <div className="relative m-auto flex w-full max-w-md flex-col items-center px-6 py-16 text-center">
      <div className="relative isolate mb-9">
        <span aria-hidden="true" className="auth-splash-logo-glow pointer-events-none absolute -inset-8 rounded-full motion-reduce:animate-none" />
        <img src="/favicon.svg" alt="Gakuren" className="relative h-24 w-24 rounded-3xl shadow-lg shadow-blue-900/10 sm:h-28 sm:w-28" />
      </div>

      <div key={failed ? "fallback" : "loading"} className="w-full motion-safe:animate-fade-up">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">Gakuren</p>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none sm:text-3xl">
          {failed ? "Mari coba sekali lagi" : "Menyiapkan ruang sekolah Anda"}
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
          {failed
            ? "Kami belum dapat menghubungkan sesi Anda. Periksa koneksi internet, lalu coba kembali."
            : "Sebentar, kami sedang memulihkan sesi agar Anda dapat melanjutkan aktivitas."}
        </p>

        {failed ? <div className="mt-8 flex flex-col gap-3">
          <div className="mb-2 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <WifiOff aria-hidden="true" className="h-4 w-4" />
            <span>Sesi belum terhubung</span>
          </div>
          <button type="button" onClick={onRetry} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 dark:focus-visible:ring-offset-slate-950">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />Coba lagi
          </button>
          <button type="button" onClick={onLogin} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-white/5">
            Masuk kembali<ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div> : <div role="status" aria-live="polite" className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-blue-100 bg-white/80 px-4 py-2.5 text-xs font-medium text-blue-700 dark:border-blue-400/15 dark:bg-blue-400/5 dark:text-blue-200">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          Memulihkan sesi
        </div>}
      </div>
    </div>

    <p className="relative shrink-0 px-6 pb-8 text-center text-xs text-slate-400 dark:text-slate-500">Sistem Manajemen Sekolah</p>
  </main>;
}
