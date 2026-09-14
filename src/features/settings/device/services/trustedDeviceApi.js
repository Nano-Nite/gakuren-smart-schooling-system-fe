import API_CONFIG from '../../../../shared/config/api';
import { authenticatedRequest } from '../../../../shared/utils/api';
import { getCacheScope } from '../../../../shared/utils/authScope';
import { getMenuPermissions } from '../../../../shared/utils/permissions';
import { assertPrivateKey, exportDevicePublicKey, generateDeviceKeys, trustedDeviceError } from '../../../../shared/utils/crypto';
import { assertDeviceScope, getDeviceRecord, getOrCreateDeviceIdentifier, savePrivateKey, updateDeviceRecord } from './trustedDeviceKeyStore';

export const DEVICE_STATUS_LABELS = { PENDING: 'Menunggu persetujuan', ACTIVE: 'Perangkat aktif', REVOKED: 'Perangkat dicabut', SUSPENDED: 'Perangkat dinonaktifkan sementara', PREPARED: 'Persiapan tersimpan', KEY_MISSING: 'Kunci keamanan tidak ditemukan' };
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function trustedDeviceErrorMessage(error) {
  const http = {
    400: 'Data pendaftaran belum sesuai. Periksa nama dan lokasi perangkat.',
    401: 'Sesi Anda berakhir. Silakan masuk kembali.',
    403: 'Anda belum memiliki izin untuk tindakan ini. Hubungi pengelola sekolah.',
    404: 'Layanan atau data perangkat belum tersedia. Coba lagi nanti atau hubungi pengelola sekolah.',
    405: 'Layanan pendaftaran belum tersedia. Persiapan perangkat tetap tersimpan.',
    409: 'Perangkat sudah tercatat atau data pendaftaran bertentangan. Hubungi pengelola untuk memeriksa pendaftaran; kunci lama tetap disimpan.',
    410: 'Pendaftaran perangkat tidak lagi berlaku. Hubungi pengelola sekolah.',
    413: 'Data pendaftaran terlalu besar. Hubungi pengelola sekolah.',
    422: 'Nama, lokasi, atau pilihan perangkat ditolak. Hubungi pengelola jika data sudah benar.',
    429: 'Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.',
    501: 'Layanan pendaftaran belum tersedia. Persiapan perangkat tetap tersimpan.',
  };
  const browser = {
    NotSupportedError: 'Browser ini belum mendukung keamanan perangkat yang diperlukan Gakuren. Gunakan Chrome/Edge versi terbaru.',
    QuotaExceededError: 'Ruang penyimpanan penuh. Kosongkan ruang perangkat lalu coba lagi.',
    SecurityError: 'Penyimpanan atau keamanan situs diblokir. Periksa izin situs atau hubungi pengelola.',
    DataCloneError: 'Browser tidak dapat menyimpan data keamanan. Perbarui browser lalu coba lagi.',
    InvalidStateError: 'Penyimpanan belum dapat dibuka. Tutup halaman Gakuren lainnya lalu coba lagi.',
    ConstraintError: 'Perangkat sudah disiapkan dari halaman lain. Muat ulang untuk melanjutkan.',
    OperationError: 'Data keamanan perangkat tidak dapat digunakan. Hubungi pengelola sekolah.',
    AbortError: 'Permintaan terhenti atau terlalu lama. Hasil pendaftaran belum dapat dipastikan. Kunci tetap tersimpan; coba periksa status kembali.',
  };
  return http[error?.status] || browser[error?.name] || (error?.status >= 500 ? 'Server belum dapat memproses permintaan. Persiapan tetap tersimpan; coba lagi nanti.' : error?.code ? error.message : 'Tidak dapat memeriksa atau mendaftarkan perangkat. Periksa koneksi internet lalu coba lagi.');
}

export function buildRegistrationPayload({ name, locationUuid, config }, identifier, key) {
  if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 80 || /[\u0000-\u001f\u007f]/.test(name)) throw trustedDeviceError('VALIDATION', 'Isi nama perangkat dengan 3–80 karakter tanpa baris baru.');
  if (!uuid(locationUuid)) throw trustedDeviceError('LOCATION', 'Pilih lokasi perangkat dari daftar lokasi sekolah.');
  if (!config || typeof config.attendance_enabled !== 'boolean' || typeof config.auto_sync !== 'boolean' || ![1, 3, 7].includes(config.retention_days)) throw trustedDeviceError('VALIDATION', 'Pilih lama penyimpanan 1, 3, atau 7 hari.');
  return { device_name: name.trim(), location_uuid: locationUuid, device_identifier: identifier,
    key: { algorithm: key.algorithm, public_key_format: key.public_key_format, public_key: key.public_key, fingerprint: key.fingerprint },
    offline_capability: { attendance_offline: config.attendance_enabled, auto_sync: config.auto_sync, temporary_storage_days: config.retention_days } };
}

export function parseDeviceResponse(response, expectedUuid) {
  const data = response?.data;
  if (response?.error || !data || !uuid(data.device_uuid) || (expectedUuid && expectedUuid !== data.device_uuid) || !['PENDING', 'ACTIVE', 'REVOKED', 'SUSPENDED'].includes(data.status) || !Number.isInteger(data.key_version) || data.key_version < 1 || typeof data.device_code !== 'string' || !data.device_code.trim()) throw trustedDeviceError('RESPONSE', 'Respons perangkat belum sesuai. Hubungi pengelola sekolah; kunci perangkat tetap tersimpan.');
  return { deviceUuid: data.device_uuid, deviceCode: data.device_code, status: data.status, keyVersion: data.key_version, checkedAt: new Date().toISOString() };
}

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, API_CONFIG.REQUEST_TIMEOUT);
  try { return await authenticatedRequest(endpoint, { ...options, signal: controller.signal, sessionScopeOnly: true }); }
  finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); }
}

export async function loadTrustedDevice(scope = getCacheScope()) {
  let record = await getDeviceRecord(scope);
  if (!record) return null;
  // Upgrade the previous local-only preparation. Never turn its client UUID into a server UUID.
  if (!record.schemaVersion && record.payload) {
    assertPrivateKey(record.privateKey);
    const key = await exportDevicePublicKey(record.publicKey);
    const identifier = await getOrCreateDeviceIdentifier(scope);
    record = await updateDeviceRecord(current => current.schemaVersion ? current : ({
      schemaVersion: 2, privateKey: current.privateKey, publicKey: current.publicKey, key,
      algorithm: 'ED25519', localKeyVersion: 1, keyVersion: 1, deviceUuid: null,
      deviceIdentifier: identifier, createdAt: current.payload.created_at, status: 'PREPARED',
      form: { name: current.payload.device_name, locationUuid: '', config: current.payload.offline_config },
    }), scope);
  }
  if (record.schemaVersion !== 2 || !record.form?.config || !record.key?.public_key || !record.deviceIdentifier) throw trustedDeviceError('STORAGE_CORRUPT', 'Data perangkat tidak lengkap. Hubungi pengelola sekolah sebelum mendaftarkan ulang.');
  return record;
}

export async function refreshTrustedDevice(scope = getCacheScope(), signal) {
  const record = await loadTrustedDevice(scope);
  if (!record?.deviceUuid) return record;
  const metadata = parseDeviceResponse(await request(`${API_CONFIG.TRUSTED_DEVICE}/${encodeURIComponent(record.deviceUuid)}`, { method: 'GET', signal }), record.deviceUuid);
  assertDeviceScope(scope);
  return updateDeviceRecord(current => {
    if (current.deviceUuid !== record.deviceUuid) throw trustedDeviceError('DEVICE_CHANGED', 'Data perangkat berubah. Muat ulang halaman.');
    return { ...current, ...metadata };
  }, scope);
}

export async function registerTrustedDevice(form, scope = getCacheScope()) {
  assertDeviceScope(scope);
  if (!getMenuPermissions('Setting').includes('setting.device.create')) throw trustedDeviceError('PERMISSION', 'Anda belum memiliki izin untuk mendaftarkan perangkat. Hubungi pengelola sekolah.');
  let record = await loadTrustedDevice(scope);
  if (record?.deviceUuid) return refreshTrustedDevice(scope);
  if (!record) {
    // Validate before creating a key, then persist before any registration request.
    buildRegistrationPayload(form, '', {});
    const keys = await generateDeviceKeys();
    const identifier = await getOrCreateDeviceIdentifier(scope);
    record = await savePrivateKey({ schemaVersion: 2, privateKey: keys.privateKey, publicKey: keys.publicKey,
      key: keys.key, algorithm: 'ED25519', localKeyVersion: 1, keyVersion: 1, deviceUuid: null,
      deviceIdentifier: identifier, createdAt: new Date().toISOString(), status: 'PREPARED', form }, scope);
  }
  assertPrivateKey(record.privateKey);
  const lease = crypto.randomUUID();
  record = await updateDeviceRecord(current => {
    if (current.deviceUuid || current.registrationLease?.until > Date.now()) throw trustedDeviceError('BUSY', 'Pendaftaran sedang diproses dari halaman lain. Tunggu lalu periksa status.');
    const payload = current.registrationPayload || buildRegistrationPayload(form, current.deviceIdentifier, current.key);
    return { ...current, form: current.registrationPayload ? current.form : form, registrationPayload: payload, registrationLease: { id: lease, until: Date.now() + 45000 } };
  }, scope);
  try {
    const metadata = parseDeviceResponse(await request(API_CONFIG.REGISTER_TRUSTED_DEVICE, { method: 'POST', body: record.registrationPayload }));
    assertDeviceScope(scope);
    // Even if register returns ACTIVE, require a subsequent status GET before allowing signing.
    return await updateDeviceRecord(current => {
      if (current.registrationLease?.id !== lease) throw trustedDeviceError('BUSY', 'Pendaftaran berubah. Periksa status kembali.');
      return { ...current, ...metadata, status: 'PENDING', registrationLease: null };
    }, scope);
  } finally {
    // Preserve the payload and key on every error, including an ambiguous network result.
    await updateDeviceRecord(current => current.registrationLease?.id === lease ? { ...current, registrationLease: null } : current, scope).catch(() => {});
  }
}
