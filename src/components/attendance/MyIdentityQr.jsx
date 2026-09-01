import { useEffect, useMemo, useState } from "react";
import { AlertCircle, LoaderCircle, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { attendanceService } from "../../services/attendanceService";
import { offlineAttendanceStore } from "../../services/offlineAttendanceStore";
import { getUserData, isNetworkAvailable } from "../../utils/api";

const userUuidOf = user => user?.uuid || user?.user_uuid || user?.UserUUID || user?.id;

export default function MyIdentityQr() {
  const user = useMemo(() => getUserData() || {}, []);
  const ownerUuid = userUuidOf(user);
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const cached = ownerUuid ? await offlineAttendanceStore.getIdentityCredential(ownerUuid) : null;
        if (!disposed && cached) setCredential(cached);
        if (!isNetworkAvailable()) return;
        const fresh = await attendanceService.getIdentityCredential();
        if (!fresh?.qr_token) throw new Error("Server tidak mengembalikan kredensial identitas.");
        await offlineAttendanceStore.saveIdentityCredential(ownerUuid, fresh);
        if (!disposed) setCredential(fresh);
      } catch (requestError) {
        if (!disposed && !credential) setError(requestError.message || "QR identitas tidak dapat dimuat.");
      } finally { if (!disposed) setLoading(false); }
    };
    load();
    return () => { disposed = true; };
  }, [ownerUuid]);

  if (loading && !credential) return <div className="text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-3 h-7 w-7 animate-spin" />Menyiapkan QR identitas…</div>;
  if (!credential) return <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800"><AlertCircle className="mx-auto h-10 w-10" /><h2 className="mt-3 font-bold">QR identitas belum tersedia</h2><p className="mt-2 text-sm leading-6">Hubungkan perangkat ke internet terlebih dahulu untuk mengaktifkan absensi luring.</p>{error && <p className="mt-3 text-xs text-amber-700">{error}</p>}</div>;

  return <div className="w-full max-w-md text-center"><div className="mx-auto inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"><QrCode className="h-4 w-4" />QR Identitas Saya</div><h2 className="mt-4 text-xl font-bold">Tunjukkan QR ini kepada petugas</h2><p className="mt-1 text-sm text-slate-500">QR tersimpan aman di perangkat dan tetap tersedia tanpa internet.</p><div className="mx-auto mt-6 w-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><QRCodeSVG value={credential.qr_token} size={260} level="M" marginSize={1} /></div><p className="mt-4 text-xs text-slate-400">Kredensial {credential.credential_id || "terverifikasi"} · versi {credential.version ?? credential.credential_version ?? 1}</p></div>;
}
