import { useEffect, useRef, useState } from "react";
import Select from "../Select";
import DateTimeInput from "../DateTimeInput";
import { attendanceService } from "../../services/attendanceService";

import { todayAttendanceSession, toLocalInput } from "../../utils/attendanceSessionDefaults";

export default function AttendanceSessionForm({ loading, allowed, error, onSubmit }) {
  const [mode, setMode] = useState("today");
  const [customInitialized, setCustomInitialized] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationError, setLocationError] = useState("");
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const locationRun = useRef(0);
  const requestDeviceLocation = () => {
    const run = ++locationRun.current;
    setLocating(true);
    setLocationError("");
    const fail = message => {
      if (run !== locationRun.current) return;
      setLocating(false);
      setLocationError(message);
    };
    if (!navigator.geolocation) return fail("Perangkat ini tidak mendukung lokasi. Gunakan perangkat yang mendukung GPS.");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (run !== locationRun.current) return;
      setDeviceLocation({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy });
      setLocating(false);
    }, error => fail(error.code === 1 ? "Izin lokasi ditolak. Izinkan akses lokasi di browser, lalu coba lagi." : "Lokasi perangkat belum dapat diperoleh. Aktifkan lokasi, lalu coba lagi."), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };
  const [validationError, setValidationError] = useState("");
  const [form, setForm] = useState(() => {
    const defaults = todayAttendanceSession();
    return { ...defaults, valid_from: toLocalInput(new Date(defaults.valid_from)), valid_until: toLocalInput(new Date(defaults.valid_until)) };
  });
  const defaultLocation = locations[0]?.uuid || locations[0]?.id || "";
  const selectedLocation = mode === "today" ? defaultLocation : form.location_uuid;


  useEffect(() => {
    const controller = new AbortController();
    attendanceService.getLocations(controller.signal).then(items => {
      if (controller.signal.aborted) return;
      setLocations(items);
      if (!items.length) requestDeviceLocation();
      if (items[0]) setForm(current => ({ ...current, location_uuid: current.location_uuid || items[0].uuid || items[0].id }));
    }).catch(requestError => { if (requestError.name !== "AbortError" && !controller.signal.aborted) requestDeviceLocation(); });
    return () => { controller.abort(); locationRun.current += 1; };
  }, []);

  const changeMode = nextMode => {
    if (nextMode === "custom" && !customInitialized) {
      const defaults = todayAttendanceSession();
      setForm(current => ({
        ...current,
        valid_from: toLocalInput(new Date(defaults.valid_from)),
        valid_until: toLocalInput(new Date(defaults.valid_until)),
      }));
      setCustomInitialized(true);
    }
    setMode(nextMode);
    setValidationError("");
  };

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = event => {
    event.preventDefault();
    if (loading || !allowed) return;
    const values = { ...(mode === "today" ? todayAttendanceSession(defaultLocation) : form) };
    if (!values.location_uuid && deviceLocation) {
      delete values.location_uuid;
      Object.assign(values, deviceLocation);
    }
    if (!values.location_uuid && !deviceLocation) return setValidationError("Pilih lokasi absensi terlebih dahulu.");
    const validFrom = new Date(values.valid_from);
    const validUntil = new Date(values.valid_until);
    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime())) return setValidationError("Tanggal dan waktu sesi harus valid.");
    if (validUntil <= validFrom) return setValidationError("Waktu selesai harus setelah waktu mulai.");
    setValidationError("");
    onSubmit({ ...values, valid_from: validFrom.toISOString(), valid_until: validUntil.toISOString() });
  };

  return <form onSubmit={submit} className="space-y-4">
    <div><h2 className="text-lg font-bold">Buat Sesi Absensi</h2><p className="mt-1 text-sm text-slate-500">Atur sesi, lalu tampilkan QR untuk dipindai peserta.</p></div>
    {(error || locationError || validationError) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error || locationError || validationError}</p>}
    <div role="group" aria-label="Pengaturan sesi" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {[{ value: "today", label: "Hari ini" }, { value: "custom", label: "Kustom" }].map(option => <button key={option.value} type="button" disabled={loading} aria-pressed={mode === option.value} onClick={() => changeMode(option.value)} className={`min-h-11 rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 ${mode === option.value ? "bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>{option.label}</button>)}
    </div>
    {!locations.length && (locating || deviceLocation || locationError) && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
      <p>{locating ? "Lokasi sekolah tidak tersedia. Mencari lokasi perangkat…" : deviceLocation ? "Menggunakan lokasi perangkat karena lokasi sekolah tidak tersedia." : "Lokasi sekolah dan lokasi perangkat belum tersedia."}</p>
      {deviceLocation && <p className="mt-1">{deviceLocation.latitude.toFixed(6)}, {deviceLocation.longitude.toFixed(6)} · Akurasi ±{Math.round(deviceLocation.accuracy)} m</p>}
      {!locating && <button type="button" disabled={loading} onClick={requestDeviceLocation} className="mt-2 min-h-11 rounded-lg border border-amber-300 px-3 font-semibold disabled:opacity-50">{deviceLocation ? "Perbarui lokasi perangkat" : "Coba lokasi perangkat lagi"}</button>}
    </div>}
    {mode === "today" ? <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div><h3 className="text-sm font-semibold">Sesi absensi hari ini</h3><p className="mt-1 text-xs leading-5 text-slate-500">Berlaku pukul 06.00–14.00 hari ini, sesuai waktu perangkat.</p></div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-slate-500">Jenis absensi</dt><dd className="mt-1 font-medium">Kehadiran Masuk</dd></div>
        <div><dt className="text-xs text-slate-500">Peserta</dt><dd className="mt-1 font-medium">Semua</dd></div>
        <div className="col-span-2 min-w-0"><dt className="text-xs text-slate-500">Lokasi</dt><dd className="mt-1 break-words font-medium">{locations[0]?.name || (deviceLocation ? "Lokasi perangkat saat ini" : locating ? "Mencari lokasi perangkat…" : locationError ? "Lokasi tidak tersedia" : "Menunggu lokasi tersedia")}</dd></div>
      </dl>
      <p className="text-xs leading-5 text-slate-500">Pilih Kustom untuk mengubah jenis, lokasi, peserta, atau waktu absensi. Peserta harus berada dalam radius lokasi yang dipilih.</p>
    </div> : <fieldset disabled={loading} className="grid min-w-0 gap-4 sm:grid-cols-2">
      <legend className="sr-only">Parameter sesi kustom</legend>
      <label className="min-w-0 text-sm font-semibold">Jenis Absensi<Select className="mt-1.5" value={form.attendance_type} onChange={value => update("attendance_type", value)} ariaLabel="Jenis absensi" options={[{ value: "CHECK_IN", label: "Kehadiran Masuk" }, { value: "CHECK_OUT", label: "Kehadiran Pulang" }]} /></label>
      <label className="min-w-0 text-sm font-semibold">Lokasi<Select className="mt-1.5" value={form.location_uuid} onChange={value => update("location_uuid", value)} ariaLabel="Lokasi absensi" disabled={!locations.length} options={locations.length ? locations.map(item => ({ value: item.uuid || item.id, label: item.name })) : [{ value: "", label: deviceLocation ? "Lokasi perangkat saat ini" : locating ? "Mencari lokasi perangkat…" : "Lokasi belum tersedia" }]} /></label>
      <DateTimeInput required type="datetime-local" label="Berlaku Mulai" value={form.valid_from} onChange={value => update("valid_from", value)} />
      <DateTimeInput required type="datetime-local" label="Berlaku Sampai" min={form.valid_from} value={form.valid_until} onChange={value => update("valid_until", value)} />
      <label className="min-w-0 text-sm font-semibold">Peserta<Select className="mt-1.5" value={form.target_type} onChange={value => update("target_type", value)} ariaLabel="Target absensi" options={[{ value: "ALL", label: "Semua" }, { value: "STUDENT", label: "Siswa" }, { value: "STAFF", label: "Guru / Pegawai" }]} /></label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-semibold">Area absensi</p><p className="mt-1 text-xs leading-5 text-slate-500">Peserta harus berada dalam radius lokasi yang dipilih.</p></div>
    </fieldset>}
    {!allowed && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">Anda tidak memiliki izin untuk membuat sesi QR absensi.</p>}
    {allowed && <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
      <button disabled={loading || locating || (!selectedLocation && !deviceLocation)} className="action-lift inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{loading ? "Membuat sesi…" : mode === "today" ? "Buat QR Hari Ini" : "Buat Sesi & Tampilkan QR"}</button>
    </div>}
  </form>;
}
