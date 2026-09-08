import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';

const storage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
};
const session = (token = 'access-a', overrides = {}) => ({ data: {
  token: { access_token: token, refresh_token: 'must-not-be-stored' },
  user_data: { uuid: 'user-a', email: 'a@example.test', secret: 'must-not-be-stored' },
  tenant_uuid: 'tenant-a', school_uuid: 'school-a', menu: ['Dashboard'], permission: ['dashboard.read'],
  ...overrides,
} });
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

async function setup({ stored = {}, local = {} } = {}) {
  const calls = [];
  const cleaned = [];
  const browser = new EventTarget();
  const sessionStorage = storage(stored);
  const localStorage = storage(local);
  let handler = () => response(session());
  const context = vm.createContext({
    sessionStorage, localStorage, window: browser, navigator: { onLine: true },
    Event, CustomEvent, AbortController, DOMException, setTimeout, clearTimeout, console,
    fetch: async (url, options) => { calls.push({ url, ...options }); return handler(url, options); },
    clean: async scope => cleaned.push(scope),
  });
  const modules = new Map();
  async function moduleAt(filename) {
    if (modules.has(filename)) return modules.get(filename);
    const source = filename.endsWith('offlineAttendanceStore.js')
      ? 'export const clearOfflineSessionCache = scope => clean(scope);'
      : await readFile(filename, 'utf8');
    const module = new vm.SourceTextModule(source, {
      context, identifier: filename,
      initializeImportMeta: meta => { meta.env = { VITE_API_URL: 'https://api.example.test' }; },
    });
    modules.set(filename, module);
    await module.link(specifier => moduleAt(path.resolve(path.dirname(filename), `${specifier}.js`)));
    return module;
  }
  const apiModule = await moduleAt(path.resolve('src/utils/api.js'));
  await apiModule.evaluate();
  return { api: apiModule.namespace, calls, cleaned, sessionStorage, localStorage, browser,
    handle: fn => { handler = fn; },
    references: async () => {
      const module = await moduleAt(path.resolve('src/utils/dailyReferenceCache.js'));
      await module.evaluate();
      return module.namespace;
    },
  };
}

test('migrates persisted tokens and does not trust an authentication flag', async () => {
  const env = await setup({ stored: { accessToken: 'legacy', refreshToken: 'legacy', isAuthenticated: 'true' }, local: { refreshToken: 'legacy' } });
  assert.equal(env.api.isUserAuthenticated(), false);
  assert.equal(env.sessionStorage.getItem('accessToken'), null);
  assert.equal(env.localStorage.getItem('refreshToken'), null);
  await env.api.initializeAuth();
  assert.equal(env.api.getAccessToken(), 'access-a');
  assert.equal(env.sessionStorage.getItem('refreshToken'), null);
  assert.equal(env.sessionStorage.getItem('accessToken'), null);
  assert.equal(JSON.parse(env.sessionStorage.getItem('userData')).secret, undefined);
  assert.equal(env.calls[0].credentials, 'include');
  assert.equal(env.calls[0].headers['X-Requested-With'], 'XMLHttpRequest');
  assert.equal(env.calls[0].cache, 'no-store');
  assert.equal(env.calls[0].body, '{}');
});

test('login stores context and sends cookies; requests protect auth/scope headers', async () => {
  const env = await setup();
  // Password encryption is tested separately from session handling; no password here.
  await env.api.loginUser('a@example.test', '');
  assert.equal(env.api.isUserAuthenticated(), true);
  assert.equal(env.calls[0].credentials, 'include');
  env.handle(() => response({ data: [] }));
  await env.api.authenticatedRequest('/v1/school/class/update', {
    method: 'POST', body: { uuid: 'class-a' },
    headers: { Authorization: 'bad', school_uuid: 'bad', 'X-Test': 'yes' },
  });
  const call = env.calls.at(-1);
  assert.equal(call.method, 'PATCH');
  assert.equal(call.headers.Authorization, 'Bearer access-a');
  assert.equal(call.headers.school_uuid, 'school-a');
  assert.equal(call.headers.tenant_uuid, 'tenant-a');
  assert.equal(call.headers['X-Test'], 'yes');
  assert.equal(call.credentials, 'omit');
  assert.equal(call.cache, 'no-store');
});

test('concurrent 401 responses share a refresh and retry their original requests once', async () => {
  const env = await setup();
  await env.api.initializeAuth();
  const gate = deferred();
  const started = deferred();
  let refreshes = 0;
  env.handle(async (url, options) => {
    if (url.endsWith('/refresh')) { refreshes += 1; started.resolve(); await gate.promise; return response(session('access-b')); }
    return options.headers.Authorization === 'Bearer access-a' ? response({}, 401) : response({ data: 'ok' });
  });
  const requests = [env.api.authenticatedRequest('/v1/a'), env.api.authenticatedRequest('/v1/b')];
  await started.promise;
  gate.resolve();
  const results = await Promise.all(requests);
  assert.equal(refreshes, 1);
  assert.equal(results.every(result => result.data === 'ok'), true);
  assert.equal(env.calls.filter(call => call.url.endsWith('/v1/a')).length, 2);
});

test('a second 401 clears the session without looping', async () => {
  const env = await setup();
  await env.api.initializeAuth();
  env.handle(url => url.endsWith('/refresh') ? response(session('access-b')) : response({}, 401));
  await assert.rejects(env.api.authenticatedRequest('/v1/a'));
  assert.equal(env.api.isUserAuthenticated(), false);
  assert.equal(env.calls.filter(call => call.url.endsWith('/v1/a')).length, 2);
  assert.equal(env.sessionStorage.getItem('schoolUuid'), null);
  assert.ok(env.cleaned.includes('tenant-a:school-a:user-a'));
});

test('invalid refresh logs out; transient refresh failure preserves an open offline session', async () => {
  const env = await setup();
  await env.api.initializeAuth();
  env.handle(() => response({}, 503));
  await assert.rejects(env.api.refreshSession());
  assert.equal(env.api.isUserAuthenticated(), true);
  env.handle(() => response({}, 401));
  await assert.rejects(env.api.refreshSession());
  assert.equal(env.api.isUserAuthenticated(), false);
});

test('cold offline launch cannot authenticate from stored metadata', async () => {
  const env = await setup({ stored: { userData: '{"uuid":"user-a"}', isAuthenticated: 'true' } });
  env.handle(() => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(env.api.initializeAuth());
  assert.equal(env.api.isUserAuthenticated(), false);
});

test('logout during refresh cannot resurrect a session and revokes after rotation settles', async () => {
  const env = await setup();
  await env.api.initializeAuth();
  const gate = deferred();
  env.handle(url => url.endsWith('/refresh') ? gate.promise : response({}));
  const refresh = env.api.refreshSession();
  const rejected = assert.rejects(refresh, /Sesi telah berubah/);
  const logout = env.api.logoutUser('a@example.test');
  gate.resolve(response(session('access-b')));
  await Promise.all([rejected, logout]);
  assert.equal(env.api.getAccessToken(), null);
  assert.equal(env.calls.at(-1).url.endsWith('/logout'), true);
  assert.equal(env.calls.at(-1).credentials, 'include');
  assert.equal(env.calls.at(-1).headers.school_uuid, 'school-a');
  const count = env.calls.length;
  await env.api.initializeAuth();
  assert.equal(env.calls.length, count);
});

test('failed logout clears local access and persists a retry marker across reopening', async () => {
  const env = await setup();
  await env.api.initializeAuth();
  env.handle(() => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(env.api.logoutUser());
  assert.equal(env.api.isUserAuthenticated(), false);
  assert.equal(env.api.isServerLogoutPending(), true);
  await env.api.initializeAuth();
  assert.equal(env.api.isUserAuthenticated(), false);
  env.handle(() => response({}));
  await env.api.logoutUser();
  assert.equal(env.api.isServerLogoutPending(), false);
});

test('refresh rejects a changed school before exposing its access token', async () => {
  const env = await setup();
  await env.api.initializeAuth();
  const exposed = [];
  env.browser.addEventListener('gakuren:auth', () => exposed.push(env.api.getAccessToken()));
  env.handle(() => response(session('wrong-school-token', { school_uuid: 'school-b' })));
  await assert.rejects(env.api.refreshSession(), /sekolah berubah/);
  assert.equal(exposed.includes('wrong-school-token'), false);
  assert.equal(env.api.getAccessToken(), null);
});

test('cache is partitioned per owner and late responses cannot repopulate it after logout', async () => {
  const env = await setup();
  await env.api.initializeAuth();
  const refs = await env.references();
  env.handle(() => response({ data: { result: [{ uuid: 'reference-a' }] } }));
  await refs.getDailyReference('gender');
  const cacheKey = [...Array(env.localStorage.length)].map((_, i) => env.localStorage.key(i)).find(key => key.startsWith('gakuren:reference:'));
  assert.ok(cacheKey.includes('tenant-a:school-a:user-a'));
  const gate = deferred();
  env.handle(() => gate.promise);
  const request = refs.getDailyReference('gender', { forceRefresh: true });
  const rejected = assert.rejects(request, /Sesi telah berubah/);
  await env.api.clearAuthData();
  gate.resolve(response({ data: { result: [{ uuid: 'late' }] } }));
  await rejected;
  assert.equal(env.localStorage.getItem(cacheKey), null);
});

test('status references fetch all pages with 500 rows and reuse persisted full records', async () => {
  const env = await setup();
  await env.api.initializeAuth();
  const refs = await env.references();
  const records = [{ uuid: 'active-id', name: 'Aktif', code: 'active' }, { uuid: 'inactive-id', name: 'Nonaktif', code: 'inactive' }];
  let requests = 0;
  env.handle((url, options) => {
    requests += 1;
    assert.equal(url, 'https://api.example.test/v1/misc/status');
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.deepEqual(body, { search: null, filter: null, page: requests, row_per_page: 500, sort_by: [{ name: 'asc' }] });
    return response({ data: { result: [records[body.page - 1]], data_statistic: { max_page: 2 } } });
  });
  const result = await refs.getDailyReference('status');
  assert.deepEqual(JSON.parse(JSON.stringify(result.result)), records);
  await refs.getDailyReference('status');
  assert.equal(requests, 2);
  const cacheKey = [...Array(env.localStorage.length)].map((_, i) => env.localStorage.key(i)).find(key => key.endsWith(':status:all'));
  assert.deepEqual(JSON.parse(env.localStorage.getItem(cacheKey)).result, records);
});

test('logout broadcast clears another tab session', async () => {
  const env = await setup();
  await env.api.initializeAuth();
  const event = new Event('storage');
  Object.assign(event, { key: 'gakuren:logout', newValue: 'pending:123' });
  env.browser.dispatchEvent(event);
  assert.equal(env.api.isUserAuthenticated(), false);
});
