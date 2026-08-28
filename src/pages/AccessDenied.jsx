import { LockKeyhole, ShieldAlert } from "lucide-react";

export default function AccessDenied({ menu }) {
  return <div className="grid min-h-full place-items-center p-6">
    <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-card sm:p-10">
      <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-50 text-amber-600"><ShieldAlert className="h-10 w-10" /><span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-4 border-white bg-slate-100 text-slate-600"><LockKeyhole className="h-4 w-4" /></span></div>
      <h2 className="mt-6 text-xl font-bold text-slate-900">Halaman tidak tersedia untuk Anda</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">Menu <b>{menu}</b> tersedia untuk akun Anda, tetapi role Anda belum memiliki izin <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.view</code> atau <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.read</code>.</p>
      <p className="mt-4 text-xs text-slate-500">Hubungi administrator sekolah jika Anda memerlukan akses.</p>
    </section>
  </div>;
}
