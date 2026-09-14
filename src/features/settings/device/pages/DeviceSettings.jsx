import { useEffect, useState } from 'react';
import Select from '../../../../shared/components/Select';
import { getMenuPermissions } from '../../../../shared/utils/permissions';
import useTrustedDevice from '../hooks/useTrustedDevice';
import { DEVICE_STATUS_LABELS } from '../services/trustedDeviceApi';

export default function DeviceSettings() {
  const [name, setName] = useState('');
  const [locationUuid, setLocationUuid] = useState('');
  const [config, setConfig] = useState({ attendance_enabled: false, auto_sync: true, retention_days: 3 });
  const { record: draft, loading, busy, error, notice, locations, locationError, locationsLoading, keyMissing, verified, register: submitRegistration, refresh } = useTrustedDevice();
  const canCreate = getMenuPermissions('Setting').includes('setting.device.create');
  useEffect(() => {
    if (draft?.form) { setName(draft.form.name); setLocationUuid(draft.form.locationUuid); setConfig(draft.form.config); }
  }, [draft]);
  const registered = Boolean(draft?.deviceUuid);
  const active = verified && draft?.status === 'ACTIVE' && !keyMissing;
  const disabled = busy || registered || Boolean(draft?.registrationPayload) || keyMissing || !canCreate;
  const statusLabel = keyMissing ? DEVICE_STATUS_LABELS.KEY_MISSING : draft?.status === 'ACTIVE' && !verified ? 'Status terakhir: aktif' : DEVICE_STATUS_LABELS[draft?.status] || 'Belum terdaftar';
  const register = event => {
    event.preventDefault();
    if (!canCreate || busy || loading || keyMissing || registered) return;
    submitRegistration({ name, locationUuid, config });
  };
  const input = 'mt-2 min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50';

  return <div className="min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-6">

    <header>

      <h2 className="text-xl font-semibold tracking-tight text-slate-900">Perangkat</h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Siapkan ponsel atau komputer ini untuk membantu mencatat kehadiran, termasuk saat tidak ada internet.</p>

    </header>

    <div className={`rounded-xl border p-4 text-sm leading-6 ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>

      <p className="font-semibold">{active ? 'Perangkat sudah disetujui' : registered ? 'Pendaftaran perangkat sudah diterima' : 'Daftarkan perangkat yang Anda gunakan'}</p>

      <p className="mt-1">{active ? 'Perangkat ini sudah dipercaya oleh sekolah. Penggunaan fitur tetap mengikuti izin dan pengaturan sekolah.' : registered ? 'Gunakan tombol Periksa status untuk melihat hasil persetujuan terbaru dari pengelola sekolah.' : 'Pilih lokasi dan kebutuhan perangkat. Setelah didaftarkan, perangkat perlu mendapat persetujuan pengelola sekolah.'}</p>

    </div>

    {error && <div role="alert" className="flex flex-col items-start gap-2 rounded-xl bg-rose-50 p-4 text-sm leading-6 text-rose-700 sm:flex-row sm:items-center sm:justify-between"><p className="min-w-0 break-words">{error}</p><button type="button" disabled={busy} className="min-h-11 shrink-0 rounded-lg px-3 font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 disabled:opacity-50" onClick={refresh}>Coba muat ulang</button></div>}

    {notice && <p role="status" className={`rounded-xl p-4 text-sm leading-6 ${active ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-700'}`}>{notice}</p>}

    {loading ? <p role="status" className="py-8 text-center text-sm text-slate-500">Memuat informasi perangkat…</p> : <div className="grid min-w-0 items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">

      <form onSubmit={register} aria-busy={busy} className="min-w-0 rounded-xl border border-slate-200 p-4 sm:p-6">

        <h3 className="text-base font-semibold text-slate-900">Daftarkan perangkat</h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">Beri nama yang mudah dikenali, lalu pilih kebutuhan Anda.</p>

        <fieldset disabled={disabled} className="mt-6 min-w-0 space-y-6">

          <div>

            <label htmlFor="device-name" className="block text-sm font-semibold">Nama perangkat <span className="font-normal text-slate-500">(wajib)</span></label>

            <input id="device-name" required minLength={3} maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Laptop ruang tata usaha" aria-describedby="device-name-help" className={input} />

            <p id="device-name-help" className="mt-2 text-sm leading-5 text-slate-500">Gunakan 3–80 karakter, misalnya nama perangkat dan tempat penggunaannya.</p>

          </div>

          <div>
            <label htmlFor="device-location" className="mb-2 block text-sm font-semibold">Lokasi perangkat <span className="font-normal text-slate-500">(wajib)</span></label>
            <Select id="device-location" value={locationUuid} onChange={setLocationUuid} disabled={disabled || locationsLoading} ariaLabel="Lokasi perangkat" aria-describedby="device-location-help" size="large" options={[{ value: '', label: locationsLoading ? 'Memuat lokasi...' : 'Pilih lokasi perangkat' }, ...locations.map(item => ({ value: item.uuid || item.location_uuid, label: item.name || 'Lokasi sekolah' })), ...(locationUuid && !locations.some(item => (item.uuid || item.location_uuid) === locationUuid) ? [{ value: locationUuid, label: 'Lokasi pendaftaran tersimpan' }] : [])]} />
            <p id="device-location-help" className="mt-2 text-sm leading-6 text-slate-500">Pilih lokasi sekolah tempat perangkat digunakan.</p>
            {locationError ? <p role="alert" className="mt-2 text-sm text-rose-700">{locationError}</p> : !locationsLoading && !locations.length && <p className="mt-2 text-sm text-amber-800">Belum ada lokasi tersedia. Hubungi pengelola sekolah untuk menambahkan lokasi.</p>}
          </div>
          <div className="space-y-4 border-t border-slate-200 pt-5">

            <div><h4 className="text-sm font-semibold">Penggunaan tanpa internet</h4><p className="mt-1 text-sm leading-6 text-slate-500">Pilihan ini disimpan untuk digunakan setelah perangkat disetujui.</p></div>

            <label className={`checkbox-label group flex min-h-11 select-none items-start gap-3 rounded-lg py-2 text-sm ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>

              <input type="checkbox" checked={config.attendance_enabled} onChange={e => setConfig({ ...config, attendance_enabled: e.target.checked })} className="peer sr-only" aria-describedby="device-offline-help" />

              <span className="remember-box mt-0.5 shrink-0" aria-hidden="true" />

              <span className="min-w-0"><span className="font-semibold leading-6">Catat kehadiran tanpa internet</span><span id="device-offline-help" className="mt-1 block text-sm font-normal leading-6 text-slate-500">Ajukan agar perangkat ini dapat digunakan saat koneksi terputus.</span></span>

            </label>

            <label className={`checkbox-label group flex min-h-11 select-none items-start gap-3 rounded-lg py-2 text-sm ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>

              <input type="checkbox" checked={config.auto_sync} onChange={e => setConfig({ ...config, auto_sync: e.target.checked })} className="peer sr-only" aria-describedby="device-sync-help" />

              <span className="remember-box mt-0.5 shrink-0" aria-hidden="true" />

              <span className="min-w-0"><span className="font-semibold leading-6">Kirim data secara otomatis</span><span id="device-sync-help" className="mt-1 block text-sm font-normal leading-6 text-slate-500">Kirim catatan kehadiran saat perangkat kembali terhubung ke internet.</span></span>

            </label>

            <div>

              <label htmlFor="device-retention" className="mb-2 block text-sm font-semibold">Lama penyimpanan data sementara</label>

              <Select id="device-retention" value={config.retention_days} onChange={value => setConfig({ ...config, retention_days: Number(value) })} disabled={disabled} ariaLabel="Lama penyimpanan data sementara" aria-describedby="device-retention-help" size="large" className="w-full sm:max-w-xs" options={[1, 3, 7].map(days => ({ value: days, label: `${days} hari` }))} />

              <p id="device-retention-help" className="mt-2 text-sm leading-6 text-slate-500">Usulkan berapa lama data sementara disimpan di perangkat. Ketentuan akhirnya mengikuti pengaturan sekolah.</p>

            </div>

          </div>

        </fieldset>
          <div className="mt-6 border-t border-slate-200 pt-5">

            <button type="submit" disabled={busy || registered || keyMissing || !canCreate || (!draft?.registrationPayload && (!locationUuid || locationsLoading))} className="min-h-11 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white outline-none hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{busy ? 'Mendaftarkan perangkat...' : registered ? 'Perangkat sudah didaftarkan' : draft ? 'Lanjutkan pendaftaran' : 'Daftarkan perangkat'}</button>

            <p className="mt-3 text-sm leading-6 text-slate-500">{registered ? 'Periksa status di panel perangkat untuk melihat persetujuan terbaru.' : draft?.registrationPayload ? 'Persiapan tersimpan. Percobaan ulang menggunakan data dan kunci yang sama.' : 'Kunci keamanan disimpan di perangkat ini sebelum pendaftaran dikirim.'}</p>

          </div>

        {!canCreate && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800">Anda belum memiliki izin untuk mendaftarkan perangkat. Hubungi pengelola sekolah untuk meminta bantuan.</p>}

      </form>

      <section className="min-w-0 space-y-5 rounded-xl border border-slate-200 p-4 sm:p-6" aria-labelledby="device-status-title">

        <div><h3 id="device-status-title" className="text-base font-semibold">Status perangkat ini</h3><span className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold leading-5 ${active ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{statusLabel}</span></div>

        {draft && <div className="min-w-0"><p className="text-sm text-slate-500">Nama perangkat</p><p className="mt-1 break-words text-sm font-semibold [overflow-wrap:anywhere]">{draft.form.name}</p></div>}

        <p className="text-sm leading-6 text-slate-500">{keyMissing ? 'Kunci keamanan perangkat ini tidak ditemukan. Perangkat perlu didaftarkan ulang. Hubungi pengelola sekolah sebelum melanjutkan.' : active ? 'Perangkat sudah aktif dan dipercaya oleh sekolah.' : draft?.status === 'REVOKED' ? 'Akses perangkat telah dicabut. Perangkat ini tidak dapat digunakan untuk permintaan yang memerlukan perangkat tepercaya.' : draft?.status === 'SUSPENDED' ? 'Akses perangkat dihentikan sementara. Hubungi pengelola sekolah untuk bantuan.' : draft?.status === 'ACTIVE' && !verified ? 'Status aktif terakhir belum dapat dikonfirmasi. Periksa status saat terhubung ke internet.' : registered ? 'Pendaftaran sudah diterima. Tunggu persetujuan pengelola sebelum menggunakan perangkat.' : draft ? 'Persiapan sudah tersimpan. Tekan Lanjutkan pendaftaran untuk mengirim data ke sekolah.' : 'Isi formulir untuk menyiapkan perangkat ini. Gunakan perangkat pribadi atau milik sekolah yang Anda kelola.'}</p>

        {draft?.deviceCode && <div><p className="text-sm text-slate-500">Kode perangkat</p><p className="mt-1 break-all text-sm font-semibold">{draft.deviceCode}</p></div>}
        {registered && <div><button type="button" onClick={refresh} disabled={busy || loading} className="min-h-11 w-full rounded-lg border border-slate-300 px-4 text-sm font-semibold text-blue-700 disabled:opacity-50">Periksa status</button>{!verified && <p className="mt-2 text-sm leading-6 text-slate-500">Status terbaru belum diperiksa. Tekan Periksa status saat terhubung ke internet.</p>}</div>}
        <div className="border-t border-slate-200 pt-5">

          <h4 className="text-sm font-semibold">Tahap pendaftaran</h4>

          <ol className="mt-4 space-y-4 text-sm leading-6">

            {[['Persiapan tersimpan', draft ? 'Selesai. Kunci keamanan sudah disiapkan.' : 'Isi nama, lokasi, dan pilihan penggunaan.'], ['Pendaftaran perangkat', registered ? 'Selesai. Pendaftaran sudah diterima.' : 'Kirim pendaftaran ke sekolah.'], ['Menunggu persetujuan', active ? 'Selesai. Perangkat sudah disetujui.' : 'Pengelola sekolah memeriksa pendaftaran.'], ['Gunakan perangkat', active ? 'Perangkat siap digunakan sesuai izin sekolah.' : 'Tersedia setelah perangkat aktif.']].map(([title, description], index) => <li key={title} className="flex items-start gap-3"><span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index === (active ? 3 : registered ? 2 : draft ? 1 : 0) ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span><div className="min-w-0"><p className="font-medium">{title}</p><p className="mt-0.5 text-slate-500">{description}</p></div></li>)}

          </ol>

        </div>

        <div className="rounded-lg bg-slate-50 p-4 text-sm leading-6"><h4 className="font-semibold">Gunakan aplikasi penjelajah yang sama</h4><p className="mt-1 text-slate-500">Persiapan ini tersimpan di aplikasi penjelajah yang sedang Anda gunakan, misalnya Chrome. Jika Anda berganti aplikasi atau menghapus data situs, persiapan ini tidak akan tersedia di sana.</p></div>

      </section>

    </div>}


  </div>;

}

