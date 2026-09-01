import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Camera, CameraOff, CheckCircle2, QrCode, RefreshCw, ScanLine, UserRound, WifiOff } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Select from "../components/Select";
import ConfirmDialog from "../components/ConfirmDialog";
import AttendanceSessionForm from "../components/attendance/AttendanceSessionForm";
import AttendanceQrDisplay from "../components/attendance/AttendanceQrDisplay";
import AttendanceSessionSidebar from "../components/attendance/AttendanceSessionSidebar";
import MyIdentityQr from "../components/attendance/MyIdentityQr";
import OfflineQrScanner from "../components/attendance/OfflineQrScanner";
import OfflineSyncStatus from "../components/attendance/OfflineSyncStatus";
import useAttendanceSession, { attendanceErrorMessage } from "../hooks/useAttendanceSession";
import { attendanceService } from "../services/attendanceService";
import { offlineAttendanceStore } from "../services/offlineAttendanceStore";
import { isNetworkAvailable, setNetworkAvailable } from "../utils/api";
import { hasAnyPermission } from "../utils/permissions";

const extractToken = value => { try { return new URL(value).searchParams.get("t") || value; } catch { return value; } };
const getPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error("Lokasi tidak didukung oleh perangkat ini."));
  navigator.geolocation.getCurrentPosition(({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }), error => reject(new Error(error.code === 1 ? "Izin lokasi diperlukan untuk melakukan absensi." : "Lokasi perangkat tidak dapat diperoleh.")), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
});

function CameraScanner() {
  const videoRef = useRef(null), controlsRef = useRef(null), runRef = useRef(0);
  const [active, setActive] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [result, setResult] = useState(null);
  const [cameras, setCameras] = useState([]), [selectedCamera, setSelectedCamera] = useState("");
  const stopCamera = () => { runRef.current += 1; controlsRef.current?.stop(); controlsRef.current = null; if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop()); if (videoRef.current) videoRef.current.srcObject = null; setActive(false); };
  useEffect(() => stopCamera, []);
  const loadCameras = async () => { const devices = await navigator.mediaDevices?.enumerateDevices?.() || []; setCameras(devices.filter(item => item.kind === "videoinput").map((item, index) => ({ value: item.deviceId, label: item.label || `Kamera ${index + 1}` }))); };
  useEffect(() => { loadCameras().catch(() => {}); }, []);
  const submitScan = async rawValue => {
    stopCamera(); setError(""); setBusy(true);
    try {
      const location = await getPosition();
      setResult(await attendanceService.scanQr({ qr_token: extractToken(rawValue), ...location }));
    } catch (requestError) { setError(attendanceErrorMessage(requestError)); } finally { setBusy(false); }
  };
  const startCamera = async (deviceId = selectedCamera) => {
    stopCamera(); setError(""); setResult(null);
    try {
      const reader = new BrowserQRCodeReader();
      const run = runRef.current;
      const controls = await reader.decodeFromVideoDevice(deviceId || undefined, videoRef.current, decoded => {
        if (run === runRef.current && decoded?.getText()) submitScan(decoded.getText());
      });
      controlsRef.current = controls; setActive(true); await loadCameras();
    } catch (cameraError) { const messages = { NotAllowedError: "Izin kamera ditolak.", NotFoundError: "Tidak ada kamera yang terdeteksi.", NotReadableError: "Kamera sedang digunakan aplikasi lain.", SecurityError: "Kamera hanya dapat digunakan melalui HTTPS atau localhost." }; setError(messages[cameraError.name] || "Kamera tidak dapat dibuka."); stopCamera(); }
  };
  return <div className="w-full max-w-lg text-center"><h2 className="text-xl font-bold">Arahkan kamera ke QR Code</h2><p className="mt-1 text-sm text-slate-500">Lokasi akan diminta setelah QR berhasil dibaca.</p><div className="relative mx-auto mt-5 grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-3xl border-2 border-dashed border-blue-300 bg-slate-900"><video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${active ? "block" : "hidden"}`} />{!active && !result && !busy && <Camera className="h-20 w-20 text-slate-500" />}{active && <><span className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-blue-400" /><span className="pointer-events-none absolute inset-x-10 top-1/2 h-0.5 animate-pulse bg-blue-400" /></>}{(busy || result) && <div className="p-6 text-white"><CheckCircle2 className={`mx-auto h-16 w-16 ${result ? "text-emerald-400" : "animate-pulse text-blue-400"}`} /><p className="mt-3 font-semibold">{busy ? "Memvalidasi kehadiran…" : result?.message || "Kehadiran berhasil tercatat"}</p>{result?.distance_meter != null && <p className="mt-1 text-xs text-slate-300">Jarak {result.distance_meter} meter</p>}</div>}</div><div className="mx-auto mt-5 max-w-sm text-left"><div className="flex items-end gap-3"><div className="min-w-0 flex-1"><p className="mb-1.5 text-xs font-medium text-slate-500">Sumber kamera</p><Select value={selectedCamera} onChange={value => { setSelectedCamera(value); if (active) startCamera(value); }} options={[{ value: "", label: "Kamera otomatis" }, ...cameras]} ariaLabel="Pilih sumber kamera" placement="top" /></div>{active ? <button onClick={stopCamera} className="grid h-10 w-10 place-items-center rounded-lg border border-rose-200 text-rose-600" aria-label="Tutup kamera"><CameraOff className="h-4 w-4" /></button> : <button disabled={busy} onClick={() => startCamera()} className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white disabled:opacity-50" aria-label="Aktifkan kamera"><Camera className="h-4 w-4" /></button>}</div>{error && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}{(error || result) && <button type="button" onClick={() => { setError(""); setResult(null); }} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600">Scan berikutnya</button>}</div></div>;
}

function CreateWorkspace() {
  const attendance = useAttendanceSession();
  const [confirmClose, setConfirmClose] = useState(false);
  const canCreate = hasAnyPermission(["attendance.qr.create", "qrcode.create"]);
  const showForm = ["IDLE", "CREATING", "RESTORING"].includes(attendance.status) || (attendance.status === "ERROR" && !attendance.session);
  return <div className="grid gap-5 lg:contents"><div className="qr-workspace-surface min-h-[540px] rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 lg:col-start-1 lg:row-start-2 lg:p-5 lg:shadow-card">{attendance.status === "RESTORING" ? <div className="grid min-h-[480px] place-items-center text-sm text-slate-500"><span><RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />Memeriksa sesi aktif…</span></div> : showForm ? <AttendanceSessionForm loading={attendance.status === "CREATING"} allowed={canCreate} error={attendance.error} onSubmit={attendance.createSession} /> : <AttendanceQrDisplay session={attendance.session} status={attendance.status} error={attendance.error} onClose={() => setConfirmClose(true)} />}</div><AttendanceSessionSidebar attendances={attendance.attendances} summary={attendance.summary} lastUpdated={attendance.lastUpdated} /><ConfirmDialog open={confirmClose} title="Akhiri sesi absensi?" description="QR tidak dapat digunakan lagi setelah sesi ditutup." confirmLabel="Akhiri Sesi" onConfirm={() => { setConfirmClose(false); attendance.closeSession(); }} onCancel={() => setConfirmClose(false)} /></div>;
}

export default function QrCodeManagement() {
  const [tab, setTab] = useState("create"), [online, setOnline] = useState(isNetworkAvailable());
  useEffect(() => { const updateConnection = () => { if (!navigator.onLine) { setNetworkAvailable(false); setOnline(false); } }; const updateApplicationNetwork = event => setOnline(event.detail.online); window.addEventListener("online", updateConnection); window.addEventListener("offline", updateConnection); window.addEventListener("gakuren:network", updateApplicationNetwork); return () => { window.removeEventListener("online", updateConnection); window.removeEventListener("offline", updateConnection); window.removeEventListener("gakuren:network", updateApplicationNetwork); }; }, []);
  useEffect(() => {
    if (!online) return undefined;
    const controller = new AbortController();
    Promise.all([attendanceService.getOfflineConfig(controller.signal), attendanceService.getTrustedDevice(controller.signal)]).then(async ([config, device]) => {
      const hasPublicKey = config?.public_key || config?.public_key_jwk;
      if (!config?.school_uuid || !hasPublicKey || config?.private_key || config?.signing_secret) throw new Error("Konfigurasi offline dari server tidak lengkap atau tidak aman.");
      if (!device?.device_uuid || !device?.trusted || device.school_uuid !== config.school_uuid || !device.location_uuid) throw new Error("Perangkat ini belum terdaftar sebagai perangkat absensi.");
      await offlineAttendanceStore.saveOfflineConfig(config);
      await offlineAttendanceStore.saveTrustedDevice(device);
    }).catch(error => { if (error.name !== "AbortError") console.warn("Konfigurasi absensi offline belum dapat disimpan:", error.message); });
    return () => controller.abort();
  }, [online]);
  useEffect(() => { if (!online && tab === "create") setTab("scan"); }, [online, tab]);

  if (!online) return <><Helmet><title>QR Luring — Gakuren</title></Helmet><div className="qr-page mx-auto max-w-[1400px] p-4 sm:p-6"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-1.5"><button disabled title="Pembuatan QR memerlukan koneksi internet" className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 opacity-60 sm:flex-none"><QrCode className="h-4 w-4" />Buat QR Absensi</button><button onClick={() => setTab("scan")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:flex-none ${tab === "scan" ? "bg-amber-50 text-amber-700" : "text-slate-500"}`}><ScanLine className="h-4 w-4" />Pindai QR</button><button onClick={() => setTab("identity")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:flex-none ${tab === "identity" ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}><UserRound className="h-4 w-4" />QR Saya</button><span className="ml-auto hidden items-center gap-1.5 px-3 text-xs font-semibold text-amber-600 sm:inline-flex"><WifiOff className="h-4 w-4" />Mode Luring</span></div><div className="min-h-[540px] p-5">{tab === "identity" ? <div className="grid min-h-[500px] place-items-center"><MyIdentityQr /></div> : <OfflineQrScanner />}</div></section></div></>;
  return <><Helmet><title>QR Code — Gakuren</title></Helmet><div className="qr-page mx-auto max-w-[1680px] p-4 sm:p-6"><OfflineSyncStatus /><section className="qr-dashboard-shell lg:grid lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,.92fr)] lg:grid-rows-[52px_auto] lg:gap-x-5"><div className="qr-workspace-surface flex items-center rounded-t-2xl border border-b-0 border-slate-200 bg-white p-1.5 lg:col-start-1 lg:row-start-1"><button onClick={() => setTab("create")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:flex-none ${tab === "create" ? "bg-blue-50 text-blue-600" : "text-slate-500"}`}><QrCode className="h-4 w-4" />Buat QR Absensi</button><button onClick={() => setTab("scan")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:flex-none ${tab === "scan" ? "bg-blue-50 text-blue-600" : "text-slate-500"}`}><ScanLine className="h-4 w-4" />Scan QR</button><button onClick={() => setTab("identity")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:flex-none ${tab === "identity" ? "bg-blue-50 text-blue-600" : "text-slate-500"}`}><UserRound className="h-4 w-4" />QR Saya</button></div>{tab === "create" ? <CreateWorkspace /> : <div className="qr-workspace-surface grid min-h-[540px] place-items-center rounded-b-2xl border border-t-0 border-slate-200 bg-white p-5 lg:col-start-1 lg:row-start-2">{tab === "identity" ? <MyIdentityQr /> : <CameraScanner />}</div>}</section></div></>;
}
