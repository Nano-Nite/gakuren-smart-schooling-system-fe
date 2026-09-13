import { useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { isUserAuthenticated, getUserData } from '../utils/api';
import { attendanceService } from '../services/attendanceService';
import { attendanceErrorMessage } from '../hooks/useAttendanceSession';

export default function AttendanceScan() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('t');
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const user = getUserData() || {};

  if (!isUserAuthenticated()) return <Navigate to="/login" replace state={{ attendanceReturn: `${location.pathname}${location.search}` }} />;

  const submit = async () => {
    if (busyRef.current || result || !token) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const coords = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Lokasi tidak didukung oleh perangkat ini.'));
        navigator.geolocation.getCurrentPosition(position => resolve(position.coords), failure => reject(new Error(failure.code === 1 ? 'Izinkan akses lokasi untuk mencatat kehadiran.' : 'Lokasi belum dapat diperoleh. Silakan coba lagi.')), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
      });
      const response = await attendanceService.scanQr({ qr_token: token, latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy });
      setResult(response || { message: 'Kehadiran berhasil tercatat.' });
    } catch (failure) {
      setError(attendanceErrorMessage(failure));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return <><Helmet><title>Absensi | Gakuren</title><meta name="referrer" content="no-referrer" /></Helmet>
    <main className="grid min-h-[100dvh] place-items-center bg-slate-100 p-4 dark:bg-slate-950">
      <section className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-900 dark:text-white">
        <h1 className="text-2xl font-bold">Absensi Gakuren</h1>
        <p className="text-sm">{user.user_name || user.name || user.full_name || 'Akun Anda'}</p>
        {!token ? <p role="alert" className="text-rose-600">Tautan QR tidak lengkap. Pindai kembali QR sesi absensi.</p> : result ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{result.message || 'Kehadiran berhasil tercatat.'}</p> : <>
          <p className="text-sm text-slate-500">Tekan tombol di bawah dan izinkan akses lokasi untuk memverifikasi kehadiran Anda.</p>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button type="button" disabled={busy} onClick={submit} className="min-h-11 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Memproses kehadiran…' : 'Catat Kehadiran'}</button>
        </>}
        <Link to="/" className="inline-block text-sm text-blue-600">Kembali ke Gakuren</Link>
      </section>
    </main>
  </>;
}
