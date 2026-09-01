import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Clock3, RefreshCw, ScanLine, ShieldCheck, WifiOff } from "lucide-react";
import Select from "../Select";
import useOfflineAttendance from "../../hooks/useOfflineAttendance";
import { createOfflineAttendance, getOfflineContext, OFFLINE_ERROR_MESSAGES } from "../../services/offlineAttendanceService";
import { verifyIdentityCredential } from "../../utils/verifyIdentityCredential";

const statusStyle = {
  PENDING_SYNC: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  FLAGGED: "bg-orange-50 text-orange-700",
  REJECTED: "bg-rose-50 text-rose-700",
};

const statusLabel = { PENDING_SYNC: "Menunggu Sinkronisasi", VERIFIED: "Terverifikasi", FLAGGED: "Perlu Diperiksa", REJECTED: "Ditolak" };
const personTypeLabel = value => ({ STUDENT: "Siswa", TEACHER: "Guru", STAFF: "Staf", USER: "Pengguna" }[String(value || "").toUpperCase()] || value || "Pengguna");
const extractToken = value => { try { return new URL(value).searchParams.get("t") || value; } catch { return value; } };

export default function OfflineQrScanner() {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const processingRef = useRef(false);
  const lastScanRef = useRef({ token: "", at: 0 });
  const [active, setActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [context, setContext] = useState(null);
  const [contextError, setContextError] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const attendance = useOfflineAttendance();

  const stopCamera = () => {
    controlsRef.current?.stop(); controlsRef.current = null;
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  };

  const loadContext = async () => {
    try { setContext(await getOfflineContext()); setContextError(""); }
    catch (loadError) { setContext(null); setContextError(loadError.message); }
  };

  const loadCameras = async () => {
    const devices = await navigator.mediaDevices?.enumerateDevices?.() || [];
    setCameras(devices.filter(item => item.kind === "videoinput").map((item, index) => ({ value: item.deviceId, label: item.label || `Kamera ${index + 1}` })));
  };

  useEffect(() => { loadContext(); loadCameras().catch(() => {}); return stopCamera; }, []);

  const processToken = async rawValue => {
    if (processingRef.current || !context) return;
    const token = extractToken(rawValue).trim();
    const now = Date.now();
    if (lastScanRef.current.token === token && now - lastScanRef.current.at < 1800) return;
    lastScanRef.current = { token, at: now };
    processingRef.current = true; setProcessing(true); setError("");
    try {
      const identity = await verifyIdentityCredential(token, context.config);
      const record = await createOfflineAttendance(identity, token, context.config, context.device);
      setResult(record);
    } catch (scanError) {
      const message = scanError.code === "ALREADY_ATTENDED" && scanError.detail ? scanError.detail : OFFLINE_ERROR_MESSAGES[scanError.code] || scanError.message;
      setError(message || "Kredensial tidak dapat diverifikasi secara luring.");
      setResult(null);
    } finally {
      setProcessing(false);
      window.setTimeout(() => { processingRef.current = false; }, 1800);
    }
  };

  const startCamera = async (deviceId = selectedCamera) => {
    stopCamera(); setError(""); setResult(null);
    if (!context) { await loadContext(); return; }
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(deviceId || undefined, videoRef.current, decoded => {
        if (decoded?.getText()) processToken(decoded.getText());
      });
      setActive(true); await loadCameras();
    } catch (cameraError) {
      const messages = { NotAllowedError: "Izin kamera ditolak.", NotFoundError: "Tidak ada kamera yang terdeteksi.", NotReadableError: "Kamera sedang digunakan aplikasi lain.", SecurityError: "Kamera hanya dapat digunakan melalui HTTPS atau localhost." };
      setError(messages[cameraError.name] || "Kamera tidak dapat dibuka."); stopCamera();
    }
  };

  return <div className="w-full space-y-5">
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
      <section className="rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-bold"><ScanLine className="h-5 w-5 text-amber-500" />Pindai QR Pengguna</h2><p className="mt-1 text-sm text-slate-500">Arahkan QR siswa atau pegawai ke kamera.</p></div><div className="text-right"><span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700"><WifiOff className="h-3.5 w-3.5" />Mode Luring</span>{context?.device && <p className="mt-2 text-xs font-semibold text-slate-600">{context.device.device_name || "Perangkat absensi"}</p>}</div></div>
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Data kehadiran disimpan di perangkat ini dan disinkronkan ketika layanan kembali tersedia.</p>
        {contextError && <div role="alert" className="mt-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertTriangle className="h-5 w-5 shrink-0" /><div><p>{contextError}</p><button type="button" onClick={loadContext} className="mt-2 font-semibold underline">Periksa kembali</button></div></div>}
        <div className="relative mx-auto mt-5 grid aspect-video w-full max-w-2xl place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-amber-400 bg-slate-900"><video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${active ? "block" : "hidden"}`} />{!active && <Camera className="h-16 w-16 text-slate-500" />}{active && <><span className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-amber-400" /><span className="pointer-events-none absolute inset-x-[18%] top-1/2 h-0.5 animate-pulse bg-amber-400" /></>}{processing && <div className="absolute inset-0 grid place-items-center bg-slate-950/70 text-white"><div className="text-center"><RefreshCw className="mx-auto h-9 w-9 animate-spin" /><p className="mt-2 text-sm font-semibold">Memverifikasi kredensial…</p></div></div>}</div>
        <div className="mx-auto mt-4 flex max-w-2xl items-end gap-3"><div className="min-w-0 flex-1"><p className="mb-1.5 text-xs font-medium text-slate-500">Sumber kamera</p><Select value={selectedCamera} onChange={value => { setSelectedCamera(value); if (active) startCamera(value); }} options={[{ value: "", label: "Kamera otomatis" }, ...cameras]} ariaLabel="Pilih sumber kamera" placement="top" /></div>{active ? <button onClick={stopCamera} className="grid h-10 w-10 place-items-center rounded-lg border border-rose-200 text-rose-600" aria-label="Tutup kamera"><CameraOff className="h-4 w-4" /></button> : <button disabled={!context || processing} onClick={() => startCamera()} className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500 text-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="Aktifkan kamera"><Camera className="h-4 w-4" /></button>}</div>
        {error && <div role="alert" className="mx-auto mt-4 max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
        {result && <div role="status" className="mx-auto mt-4 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex gap-3"><CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" /><div><p className="font-bold text-emerald-800">Kehadiran tercatat</p><p className="mt-1 font-semibold text-slate-800">{result.display_name}</p><p className="text-sm text-slate-600">{result.person_type}{result.class_name ? ` • ${result.class_name}` : ""} • {new Date(result.recorded_at).toLocaleTimeString("id-ID")}</p><p className="mt-2 text-xs font-semibold text-amber-700">Menunggu Sinkronisasi</p></div></div></div>}
      </section>

      <aside className="space-y-4"><section className="rounded-2xl border border-slate-200 p-4"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-amber-700">Menunggu Sinkronisasi</p><p className="mt-1 text-2xl font-bold text-amber-800">{attendance.pendingCount}</p></div><div className="rounded-xl bg-blue-50 p-3"><p className="text-xs text-blue-700">Pindai Hari Ini</p><p className="mt-1 text-2xl font-bold text-blue-800">{attendance.todayCount}</p></div></div><button type="button" disabled={!attendance.online || !attendance.pendingCount || attendance.syncState === "SYNCING"} onClick={attendance.syncNow} title={!attendance.online ? "Internet diperlukan untuk sinkronisasi." : undefined} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><RefreshCw className={`h-4 w-4 ${attendance.syncState === "SYNCING" ? "animate-spin" : ""}`} />{attendance.syncState === "SYNCING" ? `Menyinkronkan ${attendance.pendingCount} data…` : "Sinkronkan Sekarang"}</button>{!attendance.online && <p className="mt-2 text-center text-xs text-slate-500">Internet diperlukan untuk sinkronisasi.</p>}{attendance.online && !attendance.pendingCount && <p className="mt-2 text-center text-xs font-semibold text-emerald-600">Semua data telah tersinkronisasi.</p>}{attendance.reviewCount > 0 && <p className="mt-2 text-center text-xs font-semibold text-orange-600">{attendance.reviewCount} data perlu diperiksa.</p>}{attendance.syncError && <p className="mt-2 text-xs text-rose-600">{attendance.syncError}</p>}</section>
        <section className="overflow-hidden rounded-2xl border border-slate-200"><header className="border-b border-slate-200 px-4 py-3"><h3 className="font-bold">Pemindaian Terbaru</h3></header><div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">{attendance.recent.length ? attendance.recent.map(item => <div key={item.local_uuid || item.local_id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.display_name || "Pengguna Gakuren"}</p><p className="mt-0.5 truncate text-xs text-slate-500">{personTypeLabel(item.person_type)}{item.class_name ? ` • ${item.class_name}` : ""}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3 w-3" />{new Date(item.recorded_at || item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusStyle[item.sync_status] || "bg-slate-100 text-slate-600"}`}>{statusLabel[item.sync_status] || item.sync_status}</span></div></div>) : <div className="p-8 text-center text-sm text-slate-500"><ShieldCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />Belum ada pemindaian luring.</div>}</div></section></aside>
    </div>
  </div>;
}
