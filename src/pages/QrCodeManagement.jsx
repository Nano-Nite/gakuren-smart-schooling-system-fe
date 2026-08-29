import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, CameraOff, Check, CheckCircle2, Clock3, MapPin, QrCode, RefreshCw, ScanLine, ShieldCheck, WifiOff } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Select from "../components/Select";
import { isNetworkAvailable, setNetworkAvailable } from "../utils/api";
import AttendanceStats from "../components/AttendanceStats";

const scans = [
  { name: "Darius Tadarus S.Si, M.Kom", role: "Guru", time: "06:37:58", method: "QR Dinamis" },
  { name: "Ahmad Fauzi, S.Pd", role: "Guru", time: "06:42:11", method: "Scan Kamera" },
  { name: "Siti Aisyah, S.Pd", role: "Guru", time: "06:48:24", method: "QR Dinamis" },
  { name: "Raffi Pratama", role: "Siswa", time: "06:55:03", method: "Scan Offline" },
  { name: "Dewi Lestari", role: "Siswa", time: "06:58:39", method: "Scan Kamera" },
];

function QrPreview({ seed }) {
  const modules = useMemo(() => Array.from({ length: 29 * 29 }, (_, index) => {
    const x = index % 29;
    const y = Math.floor(index / 29);
    const finder = (x < 7 && y < 7) || (x > 21 && y < 7) || (x < 7 && y > 21);
    const finderRing = finder && ((x % 22 === 0 || x % 22 === 6 || y % 22 === 0 || y % 22 === 6) || (x % 22 > 1 && x % 22 < 5 && y % 22 > 1 && y % 22 < 5));
    return finder ? finderRing : ((x * 17 + y * 31 + seed * 13 + x * y) % 7 < 3);
  }), [seed]);
  return <div aria-label="Pratinjau QR absensi" className="qr-preview grid aspect-square w-full grid-cols-[repeat(29,minmax(0,1fr))] overflow-hidden rounded-xl p-3 shadow-[0_18px_55px_-30px_rgba(15,23,42,.45)] ring-1 ring-slate-200">{modules.map((active, index) => <span key={index} className={active ? "qr-module-active" : "qr-module-empty"} />)}</div>;
}

function CameraScanner({ offline = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const scanSessionRef = useRef(0);
  const [active, setActive] = useState(false);
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [cameraPermission, setCameraPermission] = useState("unknown");
  const cameraOptions = [
    { value: "", label: "Kamera otomatis" },
    ...cameras.filter(camera => camera.value),
  ];

  const stopCamera = () => {
    scanSessionRef.current += 1;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  };

  useEffect(() => stopCamera, []);

  useEffect(() => {
    if (!navigator.permissions?.query) return undefined;
    let permissionStatus;
    let updatePermission;
    const readPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: "camera" });
        updatePermission = () => setCameraPermission(permissionStatus.state);
        updatePermission();
        permissionStatus.addEventListener?.("change", updatePermission);
      } catch {
        setCameraPermission("unknown");
      }
    };
    readPermission();
    return () => {
      if (permissionStatus && updatePermission) permissionStatus.removeEventListener?.("change", updatePermission);
    };
  }, []);

  const loadCameras = async currentDeviceId => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices
      .filter(device => device.kind === "videoinput")
      .map((device, index) => ({
        value: device.deviceId,
        label: device.label || `Kamera ${index + 1}`,
      }));
    setCameras(videoInputs);
    if (currentDeviceId) setSelectedCamera(currentDeviceId);
  };

  useEffect(() => {
    loadCameras().catch(() => {});
    const refreshCameras = () => loadCameras(selectedCamera).catch(() => {});
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshCameras);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshCameras);
  }, [selectedCamera]);

  const startCamera = async (deviceId = selectedCamera) => {
    setError("");
    setResult("");
    setSwitchingCamera(Boolean(streamRef.current));
    stopCamera();
    const scanSession = scanSessionRef.current;
    try {
      // Device IDs can change after reconnecting hardware or restarting a virtual camera.
      // Prefer the selected source, but allow Chromium to fall back to a working camera.
      const video = deviceId ? { deviceId: { ideal: deviceId } } : true;
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setActive(true);
      setCameraPermission("granted");
      setSwitchingCamera(false);
      const activeDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId || deviceId;
      await loadCameras(activeDeviceId);

      if (!("BarcodeDetector" in window)) {
        setError("Kamera aktif, tetapi pemindaian QR otomatis belum didukung browser ini.");
        return;
      }
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const detect = async () => {
        if (scanSession !== scanSessionRef.current || !streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            setResult(codes[0].rawValue);
            stopCamera();
            return;
          }
        } catch {
          // A video frame may not be ready yet; continue scanning.
        }
        if (scanSession === scanSessionRef.current) frameRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch (cameraError) {
      const cameraErrors = {
        NotAllowedError: "Izin kamera ditolak. Izinkan akses kamera untuk Gakuren di pengaturan browser atau perangkat.",
        NotFoundError: "Tidak ada kamera yang terdeteksi pada perangkat ini.",
        NotReadableError: "Kamera sedang digunakan aplikasi lain atau tidak dapat diakses. Tutup aplikasi kamera lain lalu coba lagi.",
        TrackStartError: "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.",
        OverconstrainedError: "Kamera yang dipilih sudah tidak tersedia. Pilih Kamera otomatis lalu coba lagi.",
        SecurityError: "Kamera hanya dapat digunakan melalui HTTPS atau localhost.",
      };
      if (cameraError.name === "NotAllowedError") setCameraPermission("denied");
      setError(cameraErrors[cameraError.name] || `Kamera tidak dapat dibuka (${cameraError.name || "kesalahan tidak diketahui"}).`);
      setSwitchingCamera(false);
      stopCamera();
    }
  };

  const changeCamera = async deviceId => {
    setSelectedCamera(deviceId);
    if (streamRef.current) await startCamera(deviceId);
  };

  return <div className="min-w-0 w-full max-w-lg text-center">
    <div className="mx-auto mb-4 max-w-md text-center">
      <h2 className="text-xl font-bold">{offline ? "Scan QR dalam mode offline" : "Arahkan kamera ke QR Code"}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{offline ? "Hasil pemindaian akan disimpan dan disinkronkan saat internet kembali." : "Pastikan seluruh kode terlihat jelas di dalam bingkai."}</p>
    </div>
    <div className={`scanner-stage relative mx-auto grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-3xl border-2 border-dashed ${offline ? "border-amber-400" : "border-blue-300"}`}>
      <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${active ? "block" : "hidden"}`} />
      {!active && !result && <Camera className="scanner-placeholder h-20 w-20" />}
      {active && <><span className={`pointer-events-none absolute inset-8 rounded-2xl border-2 ${offline ? "border-amber-400" : "border-blue-400"}`} /><span className={`pointer-events-none absolute inset-x-10 top-1/2 h-0.5 animate-pulse ${offline ? "bg-amber-400" : "bg-blue-400"}`} /></>}
      {result && <div className="p-6 text-center text-white"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" /><p className="mt-3 font-semibold">QR berhasil dipindai</p></div>}
    </div>
    <div className="mx-auto mt-5 max-w-md text-left">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1"><div className="mb-1.5 flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-500">Sumber kamera</p>{switchingCamera ? <span className="text-[10px] font-medium text-blue-500">Mengganti kamera…</span> : cameraPermission !== "unknown" && <span className={`whitespace-nowrap text-[10px] font-medium ${cameraPermission === "granted" ? "text-emerald-500" : cameraPermission === "denied" ? "text-rose-500" : "text-amber-500"}`}>{cameraPermission === "granted" ? "Izin diberikan" : cameraPermission === "denied" ? "Izin diblokir" : "Menunggu izin"}</span>}</div><Select value={selectedCamera} onChange={changeCamera} options={cameraOptions} ariaLabel="Pilih sumber kamera" className="w-full" placement="top" /></div>
        {active ? <button onClick={stopCamera} aria-label="Tutup kamera" title="Tutup kamera" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-rose-200 text-rose-600"><CameraOff className="h-4 w-4" /></button> : <button onClick={startCamera} aria-label="Aktifkan kamera" title="Aktifkan kamera" className={`action-lift grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white ${offline ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}><Camera className="h-4 w-4" /></button>}
      </div>
      {cameraPermission === "denied" && <p className="mt-2 text-xs leading-5 text-rose-500">Chromium memblokir permintaan kamera. Buka menu tiga titik pada aplikasi → Info aplikasi → Izin → Kamera, pilih Izinkan, lalu muat ulang aplikasi.</p>}
      {result && <div className="mt-3 break-all rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{result}</div>}
      {error && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">{error}</p>}
    </div>
  </div>;
}

function AttendanceSidebar({ className = "" }) {
  return <aside className={`space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 ${className}`}>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Ringkasan Hari Ini</h2><p className="mt-1 text-xs text-slate-500">Kehadiran real-time</p></div><span className="text-[10px] text-slate-400">Update 07:00 WIB</span></div><AttendanceStats /></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"><div className="flex items-center justify-between border-b border-slate-200 p-4"><div><h2 className="font-bold">Scan Terbaru</h2><p className="mt-1 text-xs text-slate-500">Aktivitas masuk terkini</p></div><button className="text-xs font-semibold text-blue-600">Lihat Semua</button></div><div className="qr-recent-list divide-y divide-slate-100">{scans.map((scan, index) => <div key={`${scan.name}-${index}`} className="flex items-center gap-3 p-3.5"><div className="qr-scan-avatar grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold">{scan.name.split(" ").slice(0, 2).map(word => word[0]).join("")}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{scan.name}</p><div className="mt-1 flex flex-wrap items-center gap-1.5"><span className="qr-role-pill rounded-full px-2 py-0.5 text-[10px] font-semibold">{scan.role}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{scan.method}</span><span className="text-[10px] text-slate-400">{scan.time} WIB</span></div></div><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /></div>)}</div></section>
  </aside>;
}

export default function QrCodeManagement() {
  const [tab, setTab] = useState("create");
  const [location, setLocation] = useState("Gerbang Utama");
  const [seed, setSeed] = useState(1);
  const [online, setOnline] = useState(isNetworkAvailable());

  useEffect(() => {
    const updateConnection = () => { setNetworkAvailable(navigator.onLine); setOnline(navigator.onLine); };
    const updateApplicationNetwork = event => setOnline(event.detail.online);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("gakuren:network", updateApplicationNetwork);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("gakuren:network", updateApplicationNetwork);
    };
  }, []);

  if (!online && tab === "scan") return <>
    <Helmet><title>Scan QR Offline — Gakuren</title></Helmet>
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4"><button onClick={() => setTab("create")} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" />Kembali</button><span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600"><WifiOff className="h-3.5 w-3.5" />Mode Offline</span></div>
        <div className="grid min-h-[560px] place-items-center p-5 sm:p-8"><CameraScanner offline /></div>
      </section>
    </div>
  </>;

  if (!online) return <>
    <Helmet><title>QR Code Tidak Tersedia — Gakuren</title></Helmet>
    <div className="grid min-h-full place-items-center p-4 sm:p-6">
      <section className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-7 text-center sm:p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-50 text-rose-600"><WifiOff className="h-10 w-10" /></div>
        <span className="mt-6 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">Layanan sementara tidak tersedia</span>
        <h2 className="mt-4 text-xl font-bold">QR Code memerlukan koneksi internet</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Pembuatan dan pemindaian QR dinonaktifkan saat offline untuk menjaga validitas serta keamanan data kehadiran.</p>
        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"><RefreshCw className="h-4 w-4 animate-spin text-blue-500" />Menunggu koneksi tersambung kembali...</div>
        <div className="mt-4 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">atau</span><span className="h-px flex-1 bg-slate-200" /></div>
        <button onClick={() => setTab("scan")} className="action-lift mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><ScanLine className="h-4 w-4" />Scan QR Offline</button>
      </section>
    </div>
  </>;

  return <>
    <Helmet><title>QR Code — Gakuren</title></Helmet>
    <div className="qr-page mx-auto max-w-[1680px] space-y-4 p-4 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,.92fr)] lg:items-start lg:gap-5 lg:space-y-0">
      <section className="qr-dashboard-shell overflow-visible rounded-2xl border-0 bg-transparent shadow-none lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,.92fr)] lg:gap-x-5">
        <div className="qr-workspace-surface flex rounded-t-2xl border border-b-0 border-slate-200 bg-white p-1.5 sm:px-4 sm:pt-3 lg:col-start-1 lg:row-start-1">
          <button onClick={() => setTab("create")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${tab === "create" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}><QrCode className="h-4 w-4" />Buat QR Absensi</button>
          <button onClick={() => setTab("scan")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${tab === "scan" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}><ScanLine className="h-4 w-4" />Scan QR</button>
        </div>

        {tab === "create" ? <div className="grid gap-5 lg:contents">
          <div className="qr-workspace-surface space-y-5 rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 lg:col-start-1 lg:row-start-2 lg:p-5 lg:shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><Select value={location} onChange={setLocation} ariaLabel="Lokasi absensi" className="w-full sm:w-52" options={["Gerbang Utama", "Gerbang Belakang", "Ruang Guru"]} /><div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />QR aktif • diperbarui otomatis</div></div>
            <div className="mx-auto w-full max-w-[420px]"><QrPreview seed={seed} /><div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-500" />Kode aman dan berubah secara berkala</div></div>
            <div className="flex justify-center"><button onClick={() => setSeed(value => value + 1)} className="action-lift inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100"><RefreshCw className="h-4 w-4" />Buat ulang QR</button></div>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/25 dark:bg-emerald-950/30 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white">DT</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">Darius Tadarus S.Si, M.Kom</h3><span className="qr-role-pill rounded-full px-2.5 py-1 text-[10px] font-semibold">Guru</span></div><p className="mt-1 text-xs text-slate-500">Matematika • ID 234235-2354235</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600"><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />06:37:58 WIB</span><span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{location}</span></div></div><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-emerald-500 text-emerald-500"><Check className="h-8 w-8" /></div></div></article>
          </div>

          <AttendanceSidebar />
        </div> : <><div className="qr-workspace-surface grid min-h-[540px] place-items-center rounded-b-2xl border border-t-0 border-slate-200 bg-white p-5 lg:col-start-1 lg:row-start-2"><CameraScanner /></div><AttendanceSidebar className="mt-4 lg:mt-0" /></>}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-center lg:col-start-1"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><WifiOff className="h-6 w-6" /></div><div className="flex-1"><h2 className="font-bold">Antrean Offline</h2><p className="mt-1 text-xs text-slate-500">40 data menunggu sinkronisasi otomatis</p></div><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600">Lihat Detail <ArrowRight className="h-4 w-4" /></button></section>
    </div>
  </>;
}
