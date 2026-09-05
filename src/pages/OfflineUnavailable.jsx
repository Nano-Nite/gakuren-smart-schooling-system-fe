import { RefreshCw, WifiOff } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useLocale } from "../context/LocaleContext";

export default function OfflineUnavailable({ menu }) {
  const { t } = useLocale();
  const menuLabel = t(`menu.${menu}`, menu);

  return <>
    <Helmet><title>{menuLabel} Tidak Tersedia | Gakuren</title></Helmet>
    <div className="grid min-h-full place-items-center p-4 sm:p-6">
      <section className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-7 text-center sm:p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-50 text-rose-600"><WifiOff className="h-10 w-10" /></div>
        <span className="mt-6 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">Layanan sementara tidak tersedia</span>
        <h2 className="mt-4 text-xl font-bold">{menuLabel} memerlukan koneksi internet</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Menu ini dinonaktifkan saat luring untuk menjaga konsistensi dan keamanan data sekolah.</p>
        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"><RefreshCw className="h-4 w-4 animate-spin text-blue-500" />Menunggu koneksi tersambung kembali...</div>
      </section>
    </div>
  </>;
}
