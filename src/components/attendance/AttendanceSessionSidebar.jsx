import { AlertTriangle, CheckCircle2, Clock3, Users } from "lucide-react";

const timeOf = item => item.scanned_at || item.attended_at || item.created_at;
const nameOf = item => item.user?.name || item.user_name || item.name || "Pengguna";

export default function AttendanceSessionSidebar({ attendances, summary, lastUpdated, className = "" }) {
  const stats = [
    ["Berhasil Scan", summary.successful ?? summary.success ?? summary.verified ?? 0, CheckCircle2, "text-emerald-500"],
    ["Menunggu", summary.waiting ?? summary.pending ?? 0, Clock3, "text-amber-500"],
    ["Anomali", summary.anomaly ?? summary.rejected ?? 0, AlertTriangle, "text-rose-500"],
    ["Total Scan", summary.total ?? attendances.length, Users, "text-blue-500"],
  ];
  return <aside className={`space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 ${className}`}>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Ringkasan Sesi</h2><p className="mt-1 text-xs text-slate-500">Data dari backend</p></div><span className="text-[10px] text-slate-400">{lastUpdated ? `Update ${lastUpdated.toLocaleTimeString("id-ID")} WIB` : "Belum ada update"}</span></div><div className="grid grid-cols-2 gap-3">{stats.map(([label, value, Icon, color]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><Icon className={`h-4 w-4 ${color}`} /><p className="mt-2 text-xl font-bold">{value}</p><p className="text-[11px] text-slate-500">{label}</p></div>)}</div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><div className="border-b border-slate-200 p-4"><h2 className="font-bold">Scan Terbaru</h2><p className="mt-1 text-xs text-slate-500">Diperbarui sekitar setiap 5 detik</p></div><div className="qr-recent-list max-h-[460px] divide-y divide-slate-100 overflow-y-auto">{attendances.length ? attendances.slice(0, 20).map((item, index) => { const name = nameOf(item); const role = item.user?.role_name || item.role_name || item.role || "User"; const verified = !["REJECTED", "ANOMALY", "FLAGGED"].includes(item.status || item.verification_status); return <div key={item.uuid || item.attendance_uuid || `${name}-${index}`} className="flex items-center gap-3 p-3.5"><div className="qr-scan-avatar grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold">{name.split(" ").slice(0, 2).map(word => word[0]).join("")}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{name}</p><div className="mt-1 flex flex-wrap items-center gap-1.5"><span className="qr-role-pill rounded-full px-2 py-0.5 text-[10px] font-semibold">{role}</span><span className="text-[10px] text-slate-400">{timeOf(item) ? new Date(timeOf(item)).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) : "—"} WIB</span></div></div>{verified ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />}</div>; }) : <p className="p-8 text-center text-sm text-slate-500">Belum ada scan pada sesi ini.</p>}</div></section>
  </aside>;
}
