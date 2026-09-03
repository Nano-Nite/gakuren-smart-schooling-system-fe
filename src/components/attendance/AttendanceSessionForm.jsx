import { useEffect, useState } from "react";
import Select from "../Select";
import { attendanceService } from "../../services/attendanceService";

const toLocalInput = date => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function AttendanceSessionForm({ loading, allowed, error, onSubmit }) {
  const [locations, setLocations] = useState([]);
  const [locationError, setLocationError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [form, setForm] = useState({ attendance_type: "CHECK_IN", location_uuid: "", target_type: "ALL", valid_from: toLocalInput(new Date()), valid_until: toLocalInput(new Date(Date.now() + 6 * 60 * 60 * 1000)) });

  useEffect(() => {
    const controller = new AbortController();
    attendanceService.getLocations(controller.signal).then(items => {
      setLocations(items);
      if (items[0]) setForm(current => ({ ...current, location_uuid: current.location_uuid || items[0].uuid || items[0].id }));
    }).catch(requestError => { if (requestError.name !== "AbortError") setLocationError(requestError.message); });
    return () => controller.abort();
  }, []);

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = event => {
    event.preventDefault();
    const validFrom = new Date(form.valid_from);
    const validUntil = new Date(form.valid_until);
    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime())) return setValidationError("Tanggal dan waktu sesi harus valid.");
    if (validUntil <= validFrom) return setValidationError("Waktu selesai harus setelah waktu mulai.");
    setValidationError("");
    onSubmit({ ...form, valid_from: new Date(form.valid_from).toISOString(), valid_until: new Date(form.valid_until).toISOString() });
  };
  const fieldClass = "mt-2 h-10 w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500";

  return <form onSubmit={submit} className="space-y-5 p-1">
    <div><h2 className="text-xl font-bold">Buat Sesi Absensi</h2><p className="mt-1 text-sm text-slate-500">Server akan membuat signed token yang digunakan sebagai isi QR.</p></div>
    {(error || locationError || validationError) && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error || locationError || validationError}</p>}
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <label className="min-w-0 text-sm font-semibold">Jenis Absensi<Select className="mt-2" value={form.attendance_type} onChange={value => update("attendance_type", value)} ariaLabel="Jenis absensi" options={[{ value: "CHECK_IN", label: "Kehadiran Masuk" }, { value: "CHECK_OUT", label: "Kehadiran Pulang" }]} /></label>
      <label className="min-w-0 text-sm font-semibold">Lokasi<Select className="mt-2" value={form.location_uuid} onChange={value => update("location_uuid", value)} ariaLabel="Lokasi absensi" options={locations.map(item => ({ value: item.uuid || item.id, label: item.name }))} /></label>
      <label className="min-w-0 text-sm font-semibold">Berlaku Mulai<input required type="datetime-local" value={form.valid_from} onChange={event => update("valid_from", event.target.value)} className={fieldClass} /></label>
      <label className="min-w-0 text-sm font-semibold">Berlaku Sampai<input required type="datetime-local" min={form.valid_from} value={form.valid_until} onChange={event => update("valid_until", event.target.value)} className={fieldClass} /></label>
      <label className="min-w-0 text-sm font-semibold">Target<Select className="mt-2" value={form.target_type} onChange={value => update("target_type", value)} ariaLabel="Target absensi" options={[{ value: "ALL", label: "Semua" }, { value: "STUDENT", label: "Siswa" }, { value: "STAFF", label: "Guru / Pegawai" }]} /></label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-semibold">Geofence</p><p className="mt-1 text-xs leading-5 text-slate-500">Radius mengikuti konfigurasi lokasi dan divalidasi oleh backend.</p></div>
    </div>
    {!allowed && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">Anda tidak memiliki izin untuk membuat sesi QR absensi.</p>}
    {allowed && <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-700">
      <button disabled={loading || !form.location_uuid} className="action-lift inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{loading ? "Membuat sesi…" : "Buat Sesi & Tampilkan QR"}</button>
    </div>}
  </form>;
}
