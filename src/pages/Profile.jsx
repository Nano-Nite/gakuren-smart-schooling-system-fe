import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Mail, MapPin, Phone, School } from "lucide-react";

export default function Profile() {
  const user = useMemo(() => { try { return JSON.parse(sessionStorage.getItem("userData") || "{}"); } catch { return {}; } }, []);
  const details = [[Mail, "Email", user.email || "-"], [Phone, "Nomor telepon", user.phone || "-"], [School, "Sekolah", user.tenant_name || "-"], [MapPin, "Alamat", user.address || "-"]];
  return <>
    <Helmet><title>Profil | Gakuren</title></Helmet>
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-500" />
        <div className="px-5 pb-6 sm:px-8">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_name || "Admin")}&background=DBEAFE&color=1D4ED8&bold=true&size=128`} alt="" className="-mt-12 h-24 w-24 rounded-full border-4 border-white shadow-md" />
          <h2 className="mt-4 text-xl font-bold">{user.user_name || "Admin"}</h2><p className="text-sm text-slate-500">{user.role_name || "Administrator"}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">{details.map(([Icon, label, value]) => <div key={label} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"><Icon className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div></div>)}</div>
        </div>
      </section>
    </div>
  </>;
}
