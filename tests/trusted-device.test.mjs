import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const locationUuid = '9be60e56-e8c8-45fc-bf8e-c2f1ad07191c';
const deviceUuid = '7c78ef12-a525-4507-b212-bc5674e20250';
const schoolUuid = '6bf09a3d-55c8-4cdc-8336-3ed7d1e58dd5';
const form = { name: 'Laptop sekolah', locationUuid, config: { attendance_enabled: true, auto_sync: true, retention_days: 7 } };
const backend = (status = 'PENDING', extra = {}) => ({ error: false, data: { device_uuid: deviceUuid, device_code: 'GKR-DEV-00001', status, key_version: 1, ...extra } });
const plain = value => JSON.parse(JSON.stringify(value));

async function setup() {
  let record = null, currentScope = `tenant:${schoolUuid}:user`, failSave = false, permissions = ['setting.device.create'];
  const identifier = webcrypto.randomUUID();
  const calls = [];
  const context = vm.createContext({ crypto: webcrypto, isSecureContext: true, TextEncoder, btoa, Date, setTimeout, clearTimeout, AbortController });
  let handler = () => backend();
  const checkScope = scope => { if (scope !== currentScope) throw Object.assign(new Error('Sesi berubah'), { code: 'SESSION' }); };
  const stubs = {
    'src/shared/utils/authScope.js': { getCacheScope: () => currentScope },
    'src/shared/utils/api.js': { authenticatedRequest: async (endpoint, options) => { calls.push({ endpoint, options, recordAtRequest: record }); return handler(endpoint, options); } },
    'src/shared/utils/permissions.js': { getMenuPermissions: () => permissions },
    'src/features/settings/device/services/trustedDeviceKeyStore.js': {
      assertDeviceScope: checkScope,
      getDeviceRecord: async scope => { checkScope(scope); return record; },
      getOrCreateDeviceIdentifier: async () => identifier,
      savePrivateKey: async value => { assert.equal(record, null); record = structuredClone(value); return record; },
      updateDeviceRecord: async (update, scope) => { checkScope(scope); if (failSave) throw new Error('storage full'); record = structuredClone(update(record)); return record; },
    },
  };
  const modules = new Map();
  async function load(filename) {
    filename = path.resolve(filename);
    if (modules.has(filename)) return modules.get(filename);
    const relative = path.relative(process.cwd(), filename).replaceAll('\\', '/');
    let module;
    if (stubs[relative]) {
      const exports = stubs[relative];
      module = new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
    } else {
      module = new vm.SourceTextModule(await readFile(filename, 'utf8'), { context, initializeImportMeta: meta => { meta.env = {}; } });
    }
    modules.set(filename, module);
    if (module instanceof vm.SourceTextModule) await module.link(specifier => load(path.resolve(path.dirname(filename), specifier + '.js')));
    return module;
  }
  const api = await load('src/features/settings/device/services/trustedDeviceApi.js'); await api.evaluate();
  const signer = await load('src/features/settings/device/services/trustedDeviceSigner.js'); await signer.evaluate();
  const crypto = await load('src/shared/utils/crypto.js'); await crypto.evaluate();
  return { api: api.namespace, signer: signer.namespace, crypto: crypto.namespace, calls, identifier,
    get record() { return record; }, set record(value) { record = value; },
    handle: fn => { handler = fn; }, changeScope: () => { currentScope = 'other'; }, failSave: () => { failSave = true; }, deny: () => { permissions = []; } };
}

test('registration persists non-extractable key before sending exact SPKI contract, then refresh activates it', async () => {
  const env = await setup();
  const pending = await env.api.registerTrustedDevice(form);
  assert.equal(pending.status, 'PENDING');
  const call = env.calls[0];
  assert.equal(call.endpoint, '/v1/school/trusted-device/register');
  assert.equal(call.recordAtRequest.privateKey.extractable, false);
  await assert.rejects(webcrypto.subtle.exportKey('pkcs8', pending.privateKey));
  const payload = plain(call.options.body);
  assert.deepEqual(Object.keys(payload).sort(), ['device_identifier', 'device_name', 'key', 'location_uuid', 'offline_capability']);
  assert.deepEqual(payload.offline_capability, { attendance_offline: true, auto_sync: true, temporary_storage_days: 7 });
  assert.equal(payload.device_identifier, env.identifier);
  assert.notEqual(payload.device_identifier, pending.deviceUuid);
  assert.equal(payload.key.algorithm, 'ED25519');
  assert.equal(payload.key.public_key_format, 'SPKI');
  const spki = Buffer.from(payload.key.public_key, 'base64');
  await webcrypto.subtle.importKey('spki', spki, 'Ed25519', true, ['verify']);
  assert.equal(payload.key.fingerprint, 'SHA256:' + createHash('sha256').update(spki).digest('hex').toUpperCase());
  assert.doesNotMatch(JSON.stringify(payload), /privateKey|tenant_uuid|school_uuid|registered_by/);
  env.handle(() => backend('ACTIVE'));
  const active = await env.api.refreshTrustedDevice();
  assert.equal(active.status, 'ACTIVE');
  assert.equal(active.key.public_key, pending.key.public_key);
  assert.equal(env.calls[1].endpoint, `/v1/school/trusted-device/${deviceUuid}`);
  assert.equal(env.calls[1].options.method, 'GET');
});

test('registration accepts backend trusted response and refresh uses GET without inventing signing metadata', async () => {
  const env = await setup();
  const response = { data: { device_uuid: deviceUuid, location_uuid: locationUuid, school_uuid: schoolUuid, trusted: true }, error: null, message: 'success' };
  env.handle(() => response);
  const registered = await env.api.registerTrustedDevice(form);
  assert.equal(env.calls[0].options.method, 'POST');
  assert.equal(registered.status, 'ACTIVE');
  assert.equal(registered.deviceUuid, deviceUuid);
  assert.equal(registered.keyVersion, null);
  await assert.rejects(env.signer.signTrustedDeviceRequest({ path: '/v1/test' }), /tidak sesuai/);
  env.handle(() => ({ ...response, data: { ...response.data, trusted: false } }));
  assert.equal((await env.api.refreshTrustedDevice()).status, 'PENDING');
  assert.equal(env.calls[1].options.method, 'GET');
  for (const extra of [{ trusted: 'true' }, { school_uuid: locationUuid }, { location_uuid: schoolUuid }, { device_uuid: locationUuid }]) {
    env.handle(() => ({ ...response, data: { ...response.data, ...extra } }));
    await assert.rejects(env.api.refreshTrustedDevice());
    assert.equal(env.record.status, 'PENDING');
  }
});

test('real signature verifies exact UTF-8 body and canonical newline order; nonce changes on each request', async () => {
  const env = await setup();
  await env.api.registerTrustedDevice(form);
  env.handle(() => backend('ACTIVE')); await env.api.refreshTrustedDevice();
  const body = JSON.stringify({ nama: 'Sekolah 日本', order: [2, 1] });
  const proof = await env.signer.signTrustedDeviceRequest({ method: 'post', path: '/v1/attendance/sessions', body });
  const canonical = ['POST', '/v1/attendance/sessions', proof.timestamp, proof.nonce, createHash('sha256').update(body).digest('hex')].join('\n');
  const signature = Buffer.from(proof.signature, 'base64');
  assert.equal(signature.length, 64);
  assert.equal(await webcrypto.subtle.verify('Ed25519', env.record.publicKey, signature, new TextEncoder().encode(canonical)), true);
  assert.equal(await webcrypto.subtle.verify('Ed25519', env.record.publicKey, signature, new TextEncoder().encode(canonical + '\n')), false);
  assert.notEqual((await env.signer.signTrustedDeviceRequest({ method: 'GET', path: '/v1/status' })).nonce, proof.nonce);
  assert.deepEqual(Object.keys(plain(env.signer.trustedDeviceHeaders(proof))).sort(), ['X-Device-ID', 'X-Key-Version', 'X-Nonce', 'X-Signature', 'X-Timestamp']);
  assert.equal(proof.privateKey, undefined);
  for (const pathname of ['https://example.com/x', '//example.com/x', '/x?random=1', '/x\nPOST', '/x/../y']) await assert.rejects(env.signer.signTrustedDeviceRequest({ path: pathname }));
  await assert.rejects(env.signer.signTrustedDeviceRequest({ path: '/x', body: {} }));
});

test('pending, suspended, revoked, missing key and mismatched key version fail closed', async () => {
  const env = await setup(); await env.api.registerTrustedDevice(form);
  for (const status of ['PENDING', 'SUSPENDED', 'REVOKED']) {
    env.record = { ...env.record, status };
    await assert.rejects(env.signer.signTrustedDeviceRequest({ path: '/v1/test' }), /belum aktif/);
  }
  env.record = { ...env.record, status: 'ACTIVE', keyVersion: 2 };
  await assert.rejects(env.signer.signTrustedDeviceRequest({ path: '/v1/test' }), /tidak sesuai/);
  env.record = { ...env.record, privateKey: null };
  await assert.rejects(env.signer.signTrustedDeviceRequest({ path: '/v1/test' }), /didaftarkan ulang/);
});

test('network retry and duplicate registration retain identical key, identifier and payload', async () => {
  const env = await setup();
  env.handle(() => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(env.api.registerTrustedDevice(form));
  const saved = env.record;
  env.handle(() => backend());
  await env.api.registerTrustedDevice({ ...form, name: 'Must not change ambiguous request' });
  assert.deepEqual(plain(env.calls[0].options.body), plain(env.calls[1].options.body));
  assert.equal(env.record.key.public_key, saved.key.public_key);
  assert.equal(env.record.deviceIdentifier, saved.deviceIdentifier);
  await env.api.registerTrustedDevice(form);
  assert.equal(env.calls.filter(call => call.endpoint === '/v1/school/trusted-device/register').length, 2);
});

test('legacy preparation migrates public key format without replacing the key or trusting the old UUID', async () => {
  const env = await setup(); const keys = await env.crypto.generateDeviceKeys();
  env.record = { privateKey: keys.privateKey, publicKey: keys.publicKey, status: 'draft', payload: { device_uuid: deviceUuid, device_name: form.name, offline_config: form.config, created_at: '2026-09-14T00:00:00Z' } };
  const migrated = await env.api.loadTrustedDevice();
  assert.equal(migrated.deviceUuid, null); assert.equal(migrated.status, 'PREPARED');
  assert.equal(migrated.key.public_key, keys.key.public_key);
  assert.equal(env.calls.length, 0);
});

test('invalid responses, wrong device and unknown status are rejected without promoting trust', async () => {
  const env = await setup();
  for (const value of [{}, backend('UNKNOWN'), backend('ACTIVE', { device_uuid: 'invalid' }), backend('ACTIVE', { key_version: 0 }), backend('ACTIVE', { device_code: null })]) assert.throws(() => env.api.parseDeviceResponse(value));
  assert.throws(() => env.api.parseDeviceResponse(backend(), locationUuid));
  env.handle(() => backend('ACTIVE')); await env.api.registerTrustedDevice(form);
  assert.equal(env.record.status, 'PENDING');
  env.handle(() => { env.changeScope(); return backend('ACTIVE'); });
  await assert.rejects(env.api.refreshTrustedDevice());
  assert.equal(env.record.status, 'PENDING');
});

test('validation and permission failure send no requests; HTTP errors never expose server internals', async () => {
  const env = await setup();
  for (const data of [{ ...form, name: 'a' }, { ...form, locationUuid: '' }, { ...form, config: { ...form.config, retention_days: 99 } }]) await assert.rejects(env.api.registerTrustedDevice(data));
  env.deny(); await assert.rejects(env.api.registerTrustedDevice(form), /izin/);
  assert.equal(env.calls.length, 0); assert.equal(env.record, null);
  for (const status of [400, 401, 403, 404, 405, 409, 410, 413, 422, 429, 500, 501, 503]) assert.doesNotMatch(env.api.trustedDeviceErrorMessage({ status, message: '<script>secret</script>' }), /secret|script/);
});

test('concurrent tab registration is rejected while request is in flight', async () => {
  const env = await setup();
  let release; const wait = new Promise(resolve => { release = resolve; });
  let entered; const ready = new Promise(resolve => { entered = resolve; });
  env.handle(async () => { entered(); await wait; return backend(); });
  const first = env.api.registerTrustedDevice(form); await ready;
  await assert.rejects(env.api.registerTrustedDevice(form), /halaman lain/);
  release(); await first;
  assert.equal(env.calls.length, 1);
});
