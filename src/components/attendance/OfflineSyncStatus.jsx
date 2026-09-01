import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import useOfflineAttendance from "../../hooks/useOfflineAttendance";

export default function OfflineSyncStatus() {
  const attendance = useOfflineAttendance();
  if (!attendance.records.length) return null;
  return <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
    {attendance.syncState === "SYNCING" ? <RefreshCw className="h-4 w-4 animate-spin text-blue-600" /> : attendance.reviewCount ? <AlertTriangle className="h-4 w-4 text-orange-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
    <span className="min-w-0 flex-1 font-medium text-slate-700">{attendance.syncState === "SYNCING" ? `Menyinkronkan ${attendance.pendingCount} data…` : attendance.pendingCount ? `${attendance.pendingCount} data menunggu sinkronisasi` : attendance.reviewCount ? `${attendance.reviewCount} data perlu diperiksa` : "Semua data offline telah tersinkronisasi"}</span>
    <button type="button" disabled={!attendance.online || !attendance.pendingCount || attendance.syncState === "SYNCING"} onClick={attendance.syncNow} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Sinkronkan Sekarang</button>
    {attendance.syncError && <p className="w-full text-xs text-rose-600">{attendance.syncError} Data lokal tetap disimpan.</p>}
  </div>;
}
