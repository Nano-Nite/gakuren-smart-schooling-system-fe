import { useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ClipboardCheck,
  Info,
  UserRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { isUserAuthenticated, getUserData } from "../utils/api";
import { attendanceService } from "../services/attendanceService";
import { attendanceErrorMessage } from "../hooks/useAttendanceSession";

export default function AttendanceScan() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("t");
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const user = getUserData() || {};

  if (!isUserAuthenticated())
    return (
      <Navigate
        to="/login"
        replace
        state={{ attendanceReturn: `${location.pathname}${location.search}` }}
      />
    );

  const submit = async () => {
    if (busyRef.current || result || !token) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const coords = await new Promise((resolve, reject) => {
        if (!navigator.geolocation)
          return reject(new Error("Lokasi tidak didukung oleh perangkat ini."));
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (failure) =>
            reject(
              new Error(
                failure.code === 1
                  ? "Izinkan akses lokasi untuk mencatat kehadiran."
                  : "Lokasi belum dapat diperoleh. Silakan coba lagi.",
              ),
            ),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      });
      const response = await attendanceService.scanQr({
        qr_token: token,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
      setResult(response || { message: "Kehadiran berhasil tercatat." });
    } catch (failure) {
      setError(attendanceErrorMessage(failure));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Konfirmasi Kehadiran | Gakuren</title>
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <main className="flex min-h-[100dvh] items-start justify-center bg-slate-100 px-4 py-8 text-slate-900 sm:items-center sm:py-12 dark:bg-slate-950 dark:text-white">
        <section
          aria-labelledby="attendance-title"
          className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <header className="border-b border-slate-100 p-5 sm:p-6 dark:border-slate-800">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
              <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
              Gakuren · Kehadiran
            </div>
            <h1
              id="attendance-title"
              className="text-2xl font-bold tracking-tight">
              Konfirmasi Kehadiran
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Catat kehadiran Anda untuk sesi dari QR yang dipindai.
            </p>
          </header>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <UserRound
                aria-hidden="true"
                className="mt-1 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-300"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Akun yang akan dicatat kehadirannya
                </p>
                <p className="mt-1 break-words font-semibold">
                  {user.user_name || user.name || user.full_name || "Akun Anda"}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Pastikan ini akun Anda sebelum melanjutkan.
                </p>
              </div>
            </div>
            {!token ? (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                Tautan QR tidak lengkap. Pindai kembali QR sesi absensi.
              </p>
            ) : result ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">
                  {result.message || "Kehadiran berhasil tercatat."}
                </p>
              </div>
            ) : (
              <>
                <aside
                  aria-labelledby="attendance-instructions"
                  className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
                  <Info
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0"
                  />
                  <div>
                    <h2
                      id="attendance-instructions"
                      className="text-sm font-semibold">
                      Izin lokasi diperlukan
                    </h2>
                    <p className="mt-1 text-sm leading-6">
                      Tekan <strong>Catat Kehadiran</strong>, lalu izinkan akses
                      lokasi saat diminta. Lokasi digunakan untuk memeriksa
                      apakah Anda berada di area absensi.
                    </p>
                  </div>
                </aside>
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                    <AlertCircle
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        Kehadiran belum dapat dikonfirmasi
                      </p>
                      <p className="mt-1 text-sm leading-6">{error}</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={submit}
                  className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50">
                  {busy ? "Memproses kehadiran…" : "Catat Kehadiran"}
                </button>
              </>
            )}
            <Link
              to="/"
              className="flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Kembali ke Gakuren
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
