import { getCacheScope } from '../../../../shared/utils/authScope';
import { assertPrivateKey, trustedDeviceError } from '../../../../shared/utils/crypto';

// Keep the original database so existing preparation keys can be migrated without regeneration.
const DB = 'gakuren-device-registration:v1';
const STORE = 'devices';
const IDENTIFIER = '@browser-installation';
export function assertDeviceScope(scope) {
  if (!scope || scope !== getCacheScope()) throw trustedDeviceError('SESSION', 'Akun atau sekolah berubah. Silakan muat ulang halaman.');
}

function transaction(scope, write, operation) {
  assertDeviceScope(scope);
  if (!globalThis.indexedDB) return Promise.reject(trustedDeviceError('STORAGE', 'Izinkan penyimpanan data situs agar perangkat dapat didaftarkan.'));
  return new Promise((resolve, reject) => {
    let db, tx, done = false, result, operationError;
    const finish = (error, value) => {
      if (done) return;
      done = true; clearTimeout(timer); db?.close();
      if (error) reject(error); else resolve(value);
    };
    const timer = setTimeout(() => { tx?.abort(); finish(trustedDeviceError('STORAGE_TIMEOUT', 'Penyimpanan terlalu lama merespons. Tutup halaman Gakuren lainnya lalu coba lagi.')); }, 10000);
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onerror = () => finish(request.error);
    request.onblocked = () => finish(trustedDeviceError('STORAGE_BLOCKED', 'Tutup halaman Gakuren lainnya agar penyimpanan dapat dibuka.'));
    request.onsuccess = () => {
      db = request.result;
      if (done) { db.close(); return; }
      db.onversionchange = () => db.close();
      try {
        assertDeviceScope(scope);
        tx = db.transaction(STORE, write ? 'readwrite' : 'readonly');
        tx.oncomplete = () => { try { assertDeviceScope(scope); finish(null, result); } catch (e) { finish(e); } };
        tx.onabort = tx.onerror = () => finish(operationError || tx.error || trustedDeviceError('STORAGE', 'Data perangkat belum berhasil disimpan. Coba lagi.'));
        operation(tx.objectStore(STORE), value => { result = value; }, error => { operationError = error; tx.abort(); });
      } catch (e) { finish(e); }
    };
  });
}

export const getDeviceRecord = (scope = getCacheScope()) => transaction(scope, false, (store, set) => { const req = store.get(scope); req.onsuccess = () => set(req.result || null); });
export const getPrivateKey = async (scope = getCacheScope()) => (await getDeviceRecord(scope))?.privateKey || null;
export const hasPrivateKey = async (scope = getCacheScope()) => { const key = await getPrivateKey(scope); if (!key) return false; assertPrivateKey(key); return true; };
// Add only: never replace a device's active key accidentally.
export const savePrivateKey = (record, scope = getCacheScope()) => {
  assertPrivateKey(record.privateKey);
  return transaction(scope, true, (store, set) => { store.add(record, scope); set(record); });
};
export const updateDeviceRecord = (update, scope = getCacheScope()) => transaction(scope, true, (store, set, fail) => {
  const req = store.get(scope);
  req.onsuccess = () => {
    try {
      assertDeviceScope(scope);
      if (!req.result) throw trustedDeviceError('KEY_MISSING', 'Data perangkat tidak ditemukan. Muat ulang halaman.');
      const next = update(req.result);
      store.put(next, scope); set(next);
    } catch (e) { fail(e); }
  };
});
// Retain metadata as a tombstone so losing a key can never silently rebind the old UUID.
export const deletePrivateKey = (scope = getCacheScope()) => updateDeviceRecord(record => ({ ...record, privateKey: null, status: 'KEY_MISSING' }), scope);
export const getOrCreateDeviceIdentifier = (scope = getCacheScope()) => transaction(scope, true, (store, set) => {
  const req = store.get(IDENTIFIER);
  req.onsuccess = () => {
    const value = req.result || crypto.randomUUID();
    if (!req.result) store.add(value, IDENTIFIER);
    set(value);
  };
});
