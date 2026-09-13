import AttendanceQrPresentation from "./AttendanceQrPresentation";
import { attendanceQrLink } from "../../utils/attendanceQrLink";
import { QRCodeSVG } from "qrcode.react";
import { Clock3, MapPin, ShieldCheck } from "lucide-react";
import { getUserData } from "../../utils/api";

const formatTime = value => value ? new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(value)) : "|";
const typeLabel = value => value === "CHECK_OUT" ? "Kehadiran Pulang" : "Kehadiran Masuk";

export default function AttendanceQrDisplay({ session, status, error, onClose, attendances, lastUpdated }) {
  const user = getUserData() || {};
  const creator = user.user_name || user.name || user.full_name || "User login";
  const active = status === "ACTIVE" || status === "CLOSING";
  const location = session.location?.name || session.location_name || "|";
  const radius = session.location?.geofence_radius_meter ?? session.geofence_radius_meter ?? session.location?.radius_meter;
  return <div className="space-y-3">
    {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">QR Absensi</h2><p className="mt-1 text-sm text-slate-500">Minta peserta memindai QR selama sesi berlangsung.</p></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}`}><span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />{status === "EXPIRED" ? "Sesi Kedaluwarsa" : active ? "Sesi Aktif" : "Sesi Ditutup"}</span></div>
    <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      {session.qr_token ? <QRCodeSVG value={attendanceQrLink(session.qr_token)} size={1024} level="M" marginSize={2} className="block h-auto w-full" /> : <div className="grid aspect-square place-items-center text-sm text-rose-600">Server tidak mengembalikan qr_token.</div>}
      {!active && <div className="absolute inset-0 grid place-items-center bg-slate-950/70 p-6 text-center text-lg font-bold text-white">{status === "EXPIRED" ? "Sesi absensi telah berakhir" : "Sesi telah berakhir"}</div>}
    </div>
    <p className="flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-500" />QR hanya berlaku untuk sesi ini</p>
    <AttendanceQrPresentation session={session} active={active} attendances={attendances} lastUpdated={lastUpdated} />
    <dl className="grid gap-3 rounded-2xl border border-slate-200 p-4 text-sm sm:grid-cols-2">
      <div><dt className="text-xs text-slate-500">Jenis</dt><dd className="mt-1 break-words font-semibold">{typeLabel(session.attendance_type)}</dd></div>
      <div><dt className="text-xs text-slate-500">Lokasi</dt><dd className="mt-1 flex items-center gap-1.5 font-semibold"><MapPin className="h-4 w-4" />{location}</dd></div>
      <div><dt className="text-xs text-slate-500">Waktu</dt><dd className="mt-1 flex items-center gap-1.5 font-semibold"><Clock3 className="h-4 w-4" />{formatTime(session.valid_from)} - {formatTime(session.valid_until)} WIB</dd></div>
      <div><dt className="text-xs text-slate-500">Area absensi</dt><dd className="mt-1 break-words font-semibold">{radius ? `Radius ${radius} meter` : "Mengikuti konfigurasi lokasi"}</dd></div>
      <div><dt className="text-xs text-slate-500">Kode sesi</dt><dd className="mt-1 break-words font-semibold">{session.session_code || session.session_uuid}</dd></div>
      <div><dt className="text-xs text-slate-500">Dibuat oleh</dt><dd className="mt-1 break-words font-semibold">{session.created_by?.name || session.created_by_name || creator}</dd></div>
    </dl>
    {active && <div className="flex justify-center"><button disabled={status === "CLOSING"} onClick={onClose} className="rounded-xl border border-rose-300 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">{status === "CLOSING" ? "Mengakhiri sesi…" : "Akhiri Sesi"}</button></div>}
  </div>;
}

