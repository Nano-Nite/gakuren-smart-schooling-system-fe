import { getCacheScope } from '../../../../shared/utils/authScope';
import { getDeviceRecord, assertDeviceScope } from './trustedDeviceKeyStore';
import { arrayBufferToBase64, assertPrivateKey, requireDeviceCrypto, sha256Hex, trustedDeviceError } from '../../../../shared/utils/crypto';

export async function signTrustedDeviceRequest({ method = 'GET', path, body = '' }) {
  requireDeviceCrypto();
  const scope = getCacheScope();
  const record = await getDeviceRecord(scope);
  return signDeviceRecordRequest(record, { method, path, body }, () => assertDeviceScope(scope));
}

export async function signDeviceRecordRequest(record, { method = 'GET', path, body = '' }, checkScope = () => {}) {
  assertPrivateKey(record?.privateKey);
  if (record.status !== 'ACTIVE' || !record.deviceUuid) throw trustedDeviceError('DEVICE_INACTIVE', 'Perangkat belum aktif. Buka halaman Perangkat untuk memeriksa statusnya.');
  if (!Number.isInteger(record.keyVersion) || record.keyVersion < 1 || record.localKeyVersion !== record.keyVersion) throw trustedDeviceError('KEY_VERSION', 'Data keamanan perangkat tidak sesuai. Hubungi pengelola sekolah.');
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[?#\s\\]/.test(path) || path.split('/').some(part => part === '.' || part === '..')) throw trustedDeviceError('SIGN_PATH', 'Alamat request bertanda tangan harus berupa pathname API.');
  const upperMethod = method.toUpperCase();
  if (!/^[A-Z]+$/.test(upperMethod) || typeof body !== 'string' || (['GET', 'HEAD'].includes(upperMethod) && body !== '')) throw trustedDeviceError('SIGN_BODY', 'Body request bertanda tangan harus berupa teks yang sama dengan data yang dikirim.');
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const message = [upperMethod, path, timestamp, nonce, await sha256Hex(body)].join('\n');
  const signature = arrayBufferToBase64(await crypto.subtle.sign({ name: 'Ed25519' }, record.privateKey, new TextEncoder().encode(message)));
  checkScope();
  return { deviceId: record.deviceUuid, keyVersion: record.keyVersion, timestamp, nonce, signature };
}

export const trustedDeviceHeaders = proof => ({
  'X-Device-ID': proof.deviceId, 'X-Key-Version': String(proof.keyVersion),
  'X-Timestamp': String(proof.timestamp), 'X-Nonce': proof.nonce, 'X-Signature': proof.signature,
});
