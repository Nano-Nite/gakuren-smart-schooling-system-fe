import AddressSearch from "../components/AddressSearch";
import LocationMap from "../components/LocationMap";
import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed, RotateCcw, RefreshCw, Search, Navigation, QrCode } from "lucide-react";
import { attendanceService } from "../services/attendanceService";
import { getMenuPermissions } from "../utils/permissions";

const blank = { name: "", latitude: "", longitude: "", radius: "100" };
const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60";

export default function LocationSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blank);
  const [locating, setLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");
  const gpsRun = useRef(0);
  const permissions = getMenuPermissions("Setting");
  const editable = permissions.includes(selected ? "setting.location.update" : "setting.location.create");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    attendanceService.getLocations(controller.signal).then(data => {
      if (!controller.signal.aborted) setItems(data);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message || "Lokasi belum dapat dimuat."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => () => { gpsRun.current += 1; }, []);
  const choose = item => {
    gpsRun.current += 1; setLocating(false); setGpsMessage(""); setSelected(item);
    setForm(item ? { name: item.name || "", latitude: item.latitude ?? "", longitude: item.longitude ?? "", radius: item.geofence_radius_meter ?? item.radius_meter ?? "100" } : blank);
  };
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const getGps = () => {
    const run = ++gpsRun.current;
    setGpsMessage("");
    if (!navigator.geolocation) { setGpsMessage("Perangkat ini tidak mendukung lokasi."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (run !== gpsRun.current) return;
      setForm(current => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }));
      setLocating(false); setGpsMessage(`Koordinat diperbarui. Akurasi GPS sekitar ${Math.round(coords.accuracy)} meter.`);
    }, err => {
      if (run !== gpsRun.current) return;
      setLocating(false); setGpsMessage(err.code === 1 ? "Izinkan akses lokasi di browser untuk mengambil koordinat." : "Lokasi belum ditemukan. Aktifkan GPS dan coba lagi.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };
  const latitude = Number(form.latitude), longitude = Number(form.longitude), radius = Number(form.radius);
  const validCoordinates = String(form.latitude).trim() !== "" && String(form.longitude).trim() !== "" && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  const validRadius = Number.isFinite(radius) && radius > 0;
  const visible = items.filter(item => String(item.name || "").toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-5 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-lg font-bold">Lokasi absensi</h2><p className="mt-1 text-sm text-slate-500">Atur titik dan jangkauan lokasi untuk absensi QR Code.</p></div>
      {permissions.includes("setting.location.create") && (selected || form.name || form.latitude !== "" || form.longitude !== "" || String(form.radius) !== "100") && <button type="button" onClick={() => choose(null)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"><RotateCcw className="h-4 w-4" />Kosongkan form</button>}
    </div>
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-xl border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Lokasi tersedia <span className="ml-1 text-slate-400">{items.length}</span></h3><button type="button" aria-label="Muat ulang lokasi" disabled={loading} onClick={() => setRevision(value => value + 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>
        <label className="relative block"><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input aria-label="Cari lokasi" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari lokasi..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-transparent pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label>
        <div className="mt-3 space-y-2">
          {loading ? <p role="status" className="py-8 text-center text-sm text-slate-500">Memuat lokasi...</p> : error ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : visible.length ? visible.map((item, index) => <button type="button" key={item.uuid || item.id || index} onClick={() => choose(item)} aria-pressed={selected === item} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${selected === item ? "border-blue-300 bg-blue-50 text-blue-700 dark:bg-slate-800" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"}`}><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0"><span className="block break-words text-sm font-semibold">{item.name || "Lokasi sekolah"}</span><span className="mt-1 block text-xs text-slate-500">Radius {item.geofence_radius_meter ?? item.radius_meter ?? "-"} m</span></span></button>) : <div className="py-8 text-center"><MapPin className="mx-auto mb-3 h-6 w-6 text-slate-300" /><p className="text-sm text-slate-500">{query ? "Lokasi tidak ditemukan." : "Belum ada lokasi tersedia."}</p></div>}
        </div>
        <p className="mt-5 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">Lokasi aktif di daftar ini tersedia saat membuat sesi QR Code.</p>
      </aside>
      <div className="min-w-0 space-y-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.9fr)]">
          <div className="space-y-4">
            <div><h3 className="font-semibold">{selected ? "Detail lokasi" : "Lokasi baru"}</h3><p className="mt-1 text-xs text-slate-500">Tentukan titik pusat area absensi sekolah.</p></div>
            <label className="block text-sm font-medium">Nama lokasi<input disabled={!editable} value={form.name} onChange={e => update("name", e.target.value)} placeholder="Contoh: Gedung utama sekolah" maxLength={150} className={inputClass} /></label>
            <AddressSearch key={selected?.uuid || selected?.id || "new"} disabled={!editable} onSelect={result => {
              gpsRun.current += 1; setLocating(false); setGpsMessage("");
              setForm(current => ({ ...current, latitude: result.latitude.toFixed(6), longitude: result.longitude.toFixed(6) }));
            }} />
            <button type="button" disabled={!editable || locating} onClick={getGps} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"><LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />{locating ? "Mengambil koordinat..." : "Gunakan lokasi saya"}</button>
            {gpsMessage && <p role="status" className="text-xs leading-5 text-slate-500">{gpsMessage}</p>}
            <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Lintang<input type="number" step="any" min="-90" max="90" disabled={!editable} value={form.latitude} onChange={e => update("latitude", e.target.value)} placeholder="-6.200000" className={inputClass} /></label><label className="text-sm font-medium">Bujur<input type="number" step="any" min="-180" max="180" disabled={!editable} value={form.longitude} onChange={e => update("longitude", e.target.value)} placeholder="106.816666" className={inputClass} /></label></div>
            {(form.latitude !== "" || form.longitude !== "") && !validCoordinates && <p role="alert" className="text-xs text-rose-600">Isi lintang -90 hingga 90 dan bujur -180 hingga 180.</p>}
            <label className="block text-sm font-medium">Radius absensi (meter)<input type="number" min="1" step="1" disabled={!editable} value={form.radius} onChange={e => update("radius", e.target.value)} className={inputClass} /></label>
            <div className="flex flex-wrap gap-2">{[50, 100, 200, 500].map(value => <button type="button" key={value} disabled={!editable} onClick={() => update("radius", String(value))} aria-pressed={radius === value} className={`min-h-9 rounded-lg border px-3 text-xs font-semibold disabled:opacity-50 ${radius === value ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}>{value} m</button>)}</div>
            {!validRadius && <p role="alert" className="text-xs text-rose-600">Radius harus lebih dari 0 meter.</p>}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 p-4 text-sm font-semibold"><Navigation className="h-4 w-4 text-blue-500" />Pratinjau jangkauan</div>
            <LocationMap latitude={validCoordinates ? latitude : null} longitude={validCoordinates ? longitude : null} radius={validRadius ? radius : null} editable={editable}
              onChange={coordinates => {
                gpsRun.current += 1; setLocating(false); setGpsMessage("");
                setForm(current => ({ ...current, ...coordinates }));
              }} />
            <div className="space-y-2 border-t border-slate-200 p-4"><p className="break-words text-sm font-semibold">{form.name || "Titik lokasi sekolah"}</p><p className="break-all font-mono text-xs text-slate-500">{validCoordinates ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "Koordinat belum ditentukan"}</p><p className="text-xs leading-5 text-slate-500">{editable ? "Klik peta atau geser penanda untuk memilih titik. Lingkaran menunjukkan radius absensi." : "Penanda menunjukkan titik pusat dan lingkaran menunjukkan radius absensi."}</p>{validCoordinates && <a href={`https://www.google.com/maps?q=${latitude},${longitude}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center text-xs font-semibold text-blue-600">Lihat titik di peta</a>}</div>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-blue-50 p-4 text-blue-800 dark:bg-slate-800 dark:text-blue-200"><QrCode className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-semibold">Area valid untuk pemindaian QR</p><p className="mt-1 text-xs leading-5">Titik pusat dan radius menentukan jangkauan absensi. Gunakan koordinat sekolah dan sesuaikan radius dengan luas area yang diperbolehkan.</p></div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"><p className="max-w-md text-xs leading-5 text-slate-500">Perubahan ini hanya pratinjau. Penyimpanan lokasi belum tersedia dan belum mengubah pengaturan QR Code.</p>{editable && <button type="button" disabled className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white opacity-40">Simpan lokasi</button>}</div>
      </div>
    </div>
  </div>;
}
