export const trustedDeviceError = (code, message) => Object.assign(new Error(message), { code });
export function requireDeviceCrypto() {
  if (!globalThis.isSecureContext || !globalThis.crypto?.subtle) throw trustedDeviceError('HTTPS', 'Buka Gakuren melalui alamat HTTPS agar perangkat dapat didaftarkan dengan aman.');
}
export const arrayBufferToBase64 = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)));
export const bufferToHex = buffer => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
export const sha256Hex = async text => bufferToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
export async function exportDevicePublicKey(publicKey) {
  const spki = await crypto.subtle.exportKey('spki', publicKey);
  return { algorithm: 'ED25519', public_key_format: 'SPKI', public_key: arrayBufferToBase64(spki), fingerprint: `SHA256:${bufferToHex(await crypto.subtle.digest('SHA-256', spki)).toUpperCase()}` };
}
export async function generateDeviceKeys() {
  requireDeviceCrypto();
  const keys = await crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify']);
  const key = await exportDevicePublicKey(keys.publicKey);
  const bytes = new TextEncoder().encode(key.fingerprint);
  const signature = await crypto.subtle.sign('Ed25519', keys.privateKey, bytes);
  if (!await crypto.subtle.verify('Ed25519', keys.publicKey, signature, bytes)) throw trustedDeviceError('KEY_INVALID', 'Data keamanan perangkat tidak dapat diperiksa. Coba lagi.');
  return { ...keys, key };
}
export function assertPrivateKey(key) {
  if (!key || key.type !== 'private' || key.extractable !== false || key.algorithm?.name !== 'Ed25519' || !key.usages?.includes('sign')) throw trustedDeviceError('KEY_MISSING', 'Kunci keamanan perangkat ini tidak ditemukan. Perangkat perlu didaftarkan ulang.');
}
