import { useCallback, useEffect, useRef, useState } from 'react';
import { getCacheScope } from '../../../../shared/utils/authScope';
import { assertPrivateKey, trustedDeviceError } from '../../../../shared/utils/crypto';
import { attendanceService } from '../../../attendance/services/attendanceService';
import { loadTrustedDevice, refreshTrustedDevice, registerTrustedDevice, trustedDeviceErrorMessage } from '../services/trustedDeviceApi';

export default function useTrustedDevice() {
  const scope = getCacheScope();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [locations, setLocations] = useState([]);
  const [locationError, setLocationError] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [verified, setVerified] = useState(false);
  const generation = useRef(0);
  const lock = useRef(false);

  useEffect(() => {
    const run = ++generation.current;
    const controller = new AbortController();
    const current = () => generation.current === run && scope === getCacheScope();
    setLoading(true); setError(''); setNotice(''); setRecord(null); setVerified(false); setLocationsLoading(true); setLocationError('');
    (async () => {
      try {
        const local = await loadTrustedDevice(scope);
        if (!current()) return;
        setRecord(local);
        if (local) assertPrivateKey(local.privateKey);
        if (local?.deviceUuid) {
          const remote = await refreshTrustedDevice(scope, controller.signal);
          if (current()) {
            setRecord(remote);
            if (remote.keyVersion != null && remote.localKeyVersion !== remote.keyVersion) throw trustedDeviceError('KEY_VERSION', 'Versi kunci keamanan perangkat tidak sesuai. Hubungi pengelola sekolah.');
            setVerified(true);
          }
        }
      } catch (e) { if (current()) setError(trustedDeviceErrorMessage(e)); }
      finally { if (current()) setLoading(false); }
    })();
    attendanceService.getLocations(controller.signal).then(items => {
      if (current()) setLocations(items.filter(item => typeof (item.uuid || item.location_uuid) === 'string'));
    }).catch(() => { if (current()) setLocationError('Daftar lokasi belum dapat dimuat.'); }).finally(() => { if (current()) setLocationsLoading(false); });
    return () => { generation.current++; controller.abort(); };
  }, [scope, revision]);

  const register = useCallback(async form => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    const run = generation.current;
    const current = () => generation.current === run && scope === getCacheScope();
    try {
      const result = await registerTrustedDevice(form, scope);
      if (current()) { setRecord(result); setVerified(typeof result.trusted === 'boolean'); setNotice(result.trusted === true ? 'Perangkat berhasil didaftarkan dan sudah dipercaya oleh sekolah.' : 'Pendaftaran berhasil dikirim. Periksa status untuk melihat persetujuan pengelola sekolah.'); }
    } catch (e) {
      if (current()) {
        setError(trustedDeviceErrorMessage(e));
        try { const local = await loadTrustedDevice(scope); if (current()) setRecord(local); } catch { /* Preserve the original actionable error. */ }
      }
    } finally { lock.current = false; if (current()) setBusy(false); }
  }, [scope]);
  let keyMissing = false;
  if (record) { try { assertPrivateKey(record.privateKey); } catch { keyMissing = true; } }
  return { record, loading, busy, error, notice, locations, locationError: locationError ? 'Daftar lokasi belum dapat dimuat. Periksa koneksi lalu coba muat ulang.' : '', locationsLoading, verified, keyMissing, register, refresh: () => { if (!lock.current) setRevision(value => value + 1); } };
}
