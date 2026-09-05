import { Construction } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function ModulePlaceholder({ title }) {
  return <>
    <Helmet><title>{title} | Gakuren</title></Helmet>
    <div className="grid min-h-full place-items-center p-6"><section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600"><Construction className="h-8 w-8" /></div><h2 className="mt-5 text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Anda memiliki akses ke menu ini. Halaman fiturnya sedang disiapkan dan akan tersedia setelah integrasi backend selesai.</p></section></div>
  </>;
}
