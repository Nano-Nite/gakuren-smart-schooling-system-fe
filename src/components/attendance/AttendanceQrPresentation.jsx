import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { attendanceQrLink } from "../../utils/attendanceQrLink";
import { CheckCircle2, Maximize2, Minimize2 } from "lucide-react";

const nameOf = item => item.user?.name || item.user_name || item.name || "Pengguna";
const keyOf = item => item.uuid || item.attendance_uuid || JSON.stringify([item.user?.uuid || item.user_uuid || nameOf(item), item.scanned_at || item.attended_at || item.created_at, item.attendance_type]);

export default function AttendanceQrPresentation({ session, active, attendances, lastUpdated }) {
  const dialogRef = useRef(null);
  const seenRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    seenRef.current = null;
    setQueue([]);
  }, [session.session_uuid]);

  useEffect(() => {
    if (!lastUpdated) return;
    const successful = attendances.filter(item => ["VERIFIED", "SUCCESS", "PRESENT"].includes(item.status || item.verification_status || item.attendance_status));
    if (!seenRef.current) {
      seenRef.current = new Set(successful.map(keyOf));
      return;
    }
    const arrivals = successful.filter(item => !seenRef.current.has(keyOf(item)));
    arrivals.forEach(item => seenRef.current.add(keyOf(item)));
    if (arrivals.length) setQueue(current => [...current, ...arrivals]);
  }, [attendances, lastUpdated]);

  const notification = queue[0];
  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setQueue(current => current.slice(1)), 6000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (!expanded) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  const popup = <div role="status" aria-live="polite" aria-atomic="true" className={expanded ? "mx-auto min-h-20 w-full max-w-lg shrink-0" : "pointer-events-none fixed bottom-5 right-5 z-[100] w-[calc(100%-2.5rem)] max-w-sm"}>
    {notification && <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-lg">
      <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" />
      <div className="min-w-0"><p className="break-words font-bold">{nameOf(notification)}</p><p className="text-sm">Kehadiran berhasil tercatat</p></div>
    </div>}
  </div>;

  return <>
    <div className="flex justify-center"><button type="button" disabled={!session.qr_token} onClick={() => setExpanded(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"><Maximize2 className="h-4 w-4" />Perbesar QR</button></div>
    {!expanded && createPortal(popup, document.body)}
    {expanded && createPortal(<dialog ref={dialogRef} aria-labelledby="qr-presentation-title" onCancel={() => setExpanded(false)} onClose={() => setExpanded(false)} className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none bg-slate-950 p-4 text-white backdrop:bg-slate-950 sm:p-6">
      <div className="flex h-full flex-col gap-4">
        <header className="flex shrink-0 items-center justify-between gap-3"><div><h2 id="qr-presentation-title" className="text-lg font-bold">QR Absensi</h2><p className="text-sm text-slate-300">{active ? "Pindai QR untuk mencatat kehadiran" : "Sesi telah berakhir"}</p></div><button autoFocus type="button" onClick={() => setExpanded(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-500 px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-blue-400"><Minimize2 className="h-4 w-4" />Tutup</button></header>
        <div className="flex min-h-0 flex-1 items-center justify-center"><div className="relative shrink-0 rounded-2xl bg-white p-4" style={{ width: "min(100%, calc(100dvh - 240px))" }}>
          <QRCodeSVG value={attendanceQrLink(session.qr_token)} size={1024} level="M" marginSize={4} className="block h-auto w-full" />
          {!active && <div className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-950/80 p-6 text-center text-xl font-bold">Sesi telah berakhir</div>}
        </div></div>
        {popup}
      </div>
    </dialog>, document.body)}
  </>;
}
