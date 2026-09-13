import { pauseNetworkChecks } from "../utils/networkCheckPause";
import ScanSessionSummary from "../components/attendance/ScanSessionSummary";
import ScanGuide from "../components/attendance/ScanGuide";
import { useEffect, useRef, useState } from "react";
import { createQrCamera } from "../utils/qrCamera";
import { Camera, CameraOff, RotateCw, CheckCircle2, RefreshCw, QrCode, ScanLine, UserRound } from "lucide-react";
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
  useEffect(() => pauseNetworkChecks(), []);
  const videoRef = useRef(null), controlsRef = useRef(null), runRef = useRef(0);
  const processingRef = useRef(false);
  const lastScanRef = useRef({ token: "", at: 0 });
  const [successfulScans, setSuccessfulScans] = useState(0);
  const [scanStage, setScanStage] = useState("");
  const [landscape, setLandscape] = useState(false);
  const [active, setActive] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [result, setResult] = useState(null);
  const [cameras, setCameras] = useState([]), [selectedCamera, setSelectedCamera] = useState("");
  const stopCamera = () => { runRef.current += 1; controlsRef.current?.stop(); controlsRef.current = null; if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop()); if (videoRef.current) videoRef.current.srcObject = null; setActive(false); };
  useEffect(() => stopCamera, []);
  const loadCameras = async () => { const devices = await navigator.mediaDevices?.enumerateDevices?.() || []; setCameras(devices.filter(item => item.kind === "videoinput").map((item, index) => ({ value: item.deviceId, label: item.label || `Kamera ${index + 1}` }))); };
  useEffect(() => { loadCameras().catch(() => {}); }, []);
  const submitScan = async rawValue => {
    const token = extractToken(rawValue);
    const now = Date.now();
    const repeated = lastScanRef.current.token === token && now - lastScanRef.current.at < 2000;
    lastScanRef.current = { token, at: now };
    if (processingRef.current || repeated) return;
    processingRef.current = true;
    setError(""); setResult(null); setBusy(true);
    try {
      setScanStage("QR terbaca. Mendapatkan lokasi…");
      const location = await getPosition();
      setScanStage("QR terbaca. Memvalidasi kehadiran…");
      setResult(await attendanceService.scanQr({ qr_token: token, ...location }));
      setSuccessfulScans(current => current + 1);
    } catch (requestError) { setError(attendanceErrorMessage(requestError)); } finally { processingRef.current = false; setBusy(false); }
  };
  const startCamera = async (deviceId = selectedCamera) => {
    stopCamera(); setError(""); setResult(null);
    const run = runRef.current;
    try {
      const controls = createQrCamera(videoRef.current, value => {
        if (run === runRef.current) submitScan(value);
      }, deviceId);
      controlsRef.current = controls;
      await controls.start();
      if (run !== runRef.current) { controls.stop(); return; }
      setActive(true);
      await loadCameras().catch(() => {});
    } catch (cameraError) {
      if (run !== runRef.current) return; const messages = { NotAllowedError: "Izin kamera ditolak.", NotFoundError: "Tidak ada kamera yang terdeteksi.", NotReadableError: "Kamera sedang digunakan aplikasi lain.", SecurityError: "Kamera hanya dapat digunakan melalui HTTPS atau localhost." }; setError(messages[cameraError.name] || "Kamera tidak dapat dibuka."); stopCamera(); }
  };
  return <div className="grid min-w-0 gap-5 lg:contents"><div className="qr-workspace-surface min-w-0 rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 lg:col-start-1 lg:row-start-2 lg:p-5 lg:shadow-card"><div className="mx-auto w-full max-w-2xl text-center"><h2 className="text-lg font-bold">Arahkan kamera ke QR Code</h2><p className="mt-1 text-sm text-slate-500">Posisikan QR di tengah, pastikan tajam dan tidak terkena pantulan cahaya. Lokasi diminta setelah QR terbaca.</p><div className="mx-auto mt-4 flex max-w-2xl justify-end"><button type="button" onClick={() => setLandscape(current => !current)} aria-pressed={landscape} aria-label="Gunakan orientasi landscape" title={landscape ? "Ubah ke portrait" : "Ubah ke landscape"} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300"><RotateCw aria-hidden="true" className="h-4 w-4" />{landscape ? "Putar ke portrait" : "Putar ke landscape"}</button></div><div className={`relative mx-auto mt-3 grid w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-blue-300 bg-slate-900 ${landscape ? "aspect-video max-w-2xl" : "aspect-[3/4] max-w-[360px]"}`} ><video ref={videoRef} playsInline muted className={`absolute inset-0 h-full w-full object-cover ${active ? "opacity-100" : "opacity-0"}`} />{!active && !result && !busy && <Camera className="h-16 w-16 text-slate-500" />}{active && <ScanGuide />}</div><div className="mx-auto mt-4 max-w-2xl text-left"><div className="flex items-end gap-3"><div className="min-w-0 flex-1"><p className="mb-1.5 text-xs font-medium text-slate-500">Sumber kamera</p><Select value={selectedCamera} onChange={value => { setSelectedCamera(value); if (active) startCamera(value); }} options={[{ value: "", label: "Kamera otomatis" }, ...cameras]} ariaLabel="Pilih sumber kamera" placement="top" /></div>{active ? <button onClick={stopCamera} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-600" aria-label="Tutup kamera"><CameraOff className="h-4 w-4" />Stop</button> : <button disabled={busy} onClick={() => startCamera()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" aria-label="Aktifkan kamera"><Camera className="h-4 w-4" />Mulai</button>}</div><p className="mt-2 text-xs leading-5 text-slate-500">QR dari layar HP: sesuaikan kecerahan sampai pola hitam-putih terlihat jelas, lalu tahan perangkat tetap stabil.</p>{(busy || result) && <div role="status" className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"><CheckCircle2 className={`mx-auto h-5 w-5 ${result ? "text-emerald-400" : "animate-pulse text-blue-400"}`} /><p className="mt-3 font-semibold">{busy ? scanStage || "QR terbaca…" : result?.message || "Kehadiran berhasil tercatat"}</p>{result?.distance_meter != null && <p className="mt-1 text-xs text-slate-300">Jarak {result.distance_meter} meter</p>}</div>}{error && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}{(error || result) && <button type="button" disabled={busy} onClick={() => { lastScanRef.current = { token: "", at: 0 }; setError(""); setResult(null); if (!active) startCamera(); }} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600">Pindai lagi</button>}</div></div></div><aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1"><ScanSessionSummary successfulScans={successfulScans} /></aside></div>;
}

function CreateWorkspace() {
  const attendance = useAttendanceSession();
  const [confirmClose, setConfirmClose] = useState(false);
  const canCreate = hasAnyPermission(["attendance.qr.create", "qrcode.create"]);
  const showForm = ["IDLE", "CREATING", "RESTORING"].includes(attendance.status) || (attendance.status === "ERROR" && !attendance.session);
  return <div className="grid min-w-0 gap-5 lg:contents"><div className="qr-workspace-surface min-w-0 overflow-hidden rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 lg:col-start-1 lg:row-start-2 lg:p-5 lg:shadow-card">{attendance.status === "RESTORING" ? <div className="grid min-h-[280px] place-items-center text-sm text-slate-500"><span><RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />Memeriksa sesi aktif…</span></div> : showForm ? <AttendanceSessionForm loading={attendance.status === "CREATING"} allowed={canCreate} error={attendance.error} onSubmit={attendance.createSession} /> : <AttendanceQrDisplay attendances={attendance.attendances} lastUpdated={attendance.lastUpdated} session={attendance.session} status={attendance.status} error={attendance.error} onClose={() => setConfirmClose(true)} />}</div><AttendanceSessionSidebar attendances={attendance.attendances} summary={attendance.summary} lastUpdated={attendance.lastUpdated} /><ConfirmDialog open={confirmClose} title="Akhiri sesi absensi?" description="QR tidak dapat digunakan lagi setelah sesi ditutup." confirmLabel="Akhiri Sesi" onConfirm={() => { setConfirmClose(false); attendance.closeSession(); }} onCancel={() => setConfirmClose(false)} /></div>;
}

function QrNavigation({ tab, onChange, online }) {
  const tabs = [
    { value: "create", label: "Buat QR", icon: QrCode },
    { value: "scan", label: "Pindai QR", icon: ScanLine },
    { value: "identity", label: "QR Saya", icon: UserRound },
  ];
  return <nav aria-label="Menu QR absensi" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
    {tabs.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={tab === value} disabled={!online && value === "create"} title={!online && value === "create" ? "Pembuatan QR memerlukan koneksi internet" : undefined} onClick={() => onChange(value)} className={`flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm ${tab === value ? "bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300" : "text-slate-500 hover:text-blue-600 dark:text-slate-400"}`}><Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{label}</button>)}
  </nav>;
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

  if (!online) return <><Helmet><title>QR Luring | Gakuren</title></Helmet><div className="qr-page mx-auto max-w-[1400px] p-4 sm:p-6"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><div className="border-b border-slate-200 p-4 dark:border-white/15"><QrNavigation tab={tab} onChange={setTab} online={false} /></div><div className="p-5">{tab === "identity" ? <div className="grid min-h-[320px] place-items-center"><MyIdentityQr /></div> : <OfflineQrScanner />}</div></section></div></>;
  return <><Helmet><title>QR Code | Gakuren</title></Helmet><div className="qr-page mx-auto max-w-[1280px] p-4 sm:p-6"><OfflineSyncStatus /><section className={`qr-dashboard-shell ${tab !== "identity" ? "lg:grid" : "max-w-2xl mx-auto"} lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_auto] lg:gap-x-4`}><div className="qr-workspace-surface min-w-0 rounded-t-2xl border border-b-0 border-slate-200 bg-white px-4 pt-4 lg:col-start-1 lg:row-start-1 lg:px-5"><QrNavigation tab={tab} onChange={setTab} online /></div>{tab === "create" ? <CreateWorkspace /> : tab === "scan" ? <CameraScanner /> : <div className="qr-workspace-surface grid place-items-center rounded-b-2xl border border-t-0 border-slate-200 bg-white p-5 lg:col-start-1 lg:row-start-2"><MyIdentityQr /></div>}</section></div></>;
}
