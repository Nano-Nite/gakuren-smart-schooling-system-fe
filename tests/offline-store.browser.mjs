// Real IndexedDB integration check. Run with BROWSER_PATH pointing to Chromium.
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const browserPath = process.env.BROWSER_PATH;
if (!browserPath) throw new Error('Set BROWSER_PATH to a Chromium browser executable.');
const profile = await mkdtemp(path.join(tmpdir(), 'gakuren-idb-test-'));
const root = path.resolve('src');
const server = createServer(async (request, response) => {
  try {
    if (request.url === '/') { response.end('<!doctype html><title>IndexedDB test</title>'); return; }
    const filename = path.resolve(`.${request.url.endsWith('.js') ? request.url : `${request.url}.js`}`);
    if (!filename.startsWith(`${root}${path.sep}`)) { response.writeHead(404).end(); return; }
    const source = (await readFile(filename, 'utf8')).replace('import.meta.env.VITE_API_URL', '"/api"');
    response.setHeader('Content-Type', 'text/javascript');
    response.end(source);
  } catch { response.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const browser = spawn(browserPath, ['--headless', '--no-first-run', '--disable-background-networking', '--disable-component-update', ...(process.env.BROWSER_TEST_NO_SANDBOX === '1' ? ['--no-sandbox'] : []), '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Browser startup timed out')), 15000);
    browser.once('error', error => { clearTimeout(timeout); reject(error); });
    browser.stderr.on('data', chunk => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  const address = new URL(endpoint);
  const page = await fetch(`http://${address.host}/json/new?about:blank`, { method: 'PUT' }).then(result => result.json());
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  let loaded;
  const pageLoaded = new Promise(resolve => { loaded = resolve; });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (process.env.DEBUG_BROWSER_TEST) console.log(message);
    if (message.method === 'Page.loadEventFired') loaded();
    if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
  };
  const send = (method, params) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 15000);
    pending.set(id, message => { clearTimeout(timer); resolve(message); });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  await Promise.race([pageLoaded, new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error('Page load timed out')), 10000);
    pageLoaded.finally(() => clearTimeout(timer));
  })]);
  const result = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `(async () => {
    const { offlineAttendanceStore: store, clearOfflineSessionCache } = await import('/src/services/offlineAttendanceStore.js');
    const { getCacheScope } = await import('/src/utils/authScope.js');
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const identify = (user, school = 'school-a') => {
      sessionStorage.setItem('userData', JSON.stringify({ uuid: user }));
      sessionStorage.setItem('tenantId', 'tenant-a');
      sessionStorage.setItem('schoolUuid', school);
    };
    identify('user-a');
    const scopeA = getCacheScope();
    await store.saveIdentityCredential('user-a', { qr_token: 'qr-a' });
    await store.saveOfflineConfig({ school_uuid: 'school-a' });
    await store.saveTrustedDevice({ device_uuid: 'device-a', school_uuid: 'school-a', trusted: true });
    await store.addPendingAttendance({ local_uuid: 'pending-a', deduplication_key: 'dedup-a', sync_status: 'PENDING_SYNC' });
    await store.addPendingAttendance({ local_uuid: 'completed-a', deduplication_key: 'dedup-complete', sync_status: 'VERIFIED' });
    identify('user-b');
    check((await store.getAllAttendances()).length === 0, 'User B saw user A attendance');
    check(!(await store.getIdentityCredential('user-a')), 'User B saw user A QR');
    await store.addPendingAttendance({ local_uuid: 'pending-b', deduplication_key: 'dedup-b', sync_status: 'PENDING_SYNC' });
    identify('user-a', 'school-b');
    check((await store.getAllAttendances()).length === 0, 'School B saw school A attendance');
    identify('user-a');
    check((await store.getAllAttendances()).length === 2, 'Owner records were lost');
    sessionStorage.clear();
    await clearOfflineSessionCache(scopeA);
    let denied = false;
    try { await store.getAllAttendances(); } catch { denied = true; }
    check(denied, 'Anonymous storage access allowed');
    identify('user-a');
    const remaining = await store.getAllAttendances();
    check(remaining.length === 1 && remaining[0].local_uuid === 'pending-a', 'Pending data lost or completed data retained');
    check(!(await store.getIdentityCredential('user-a')), 'Logout retained QR');
    check(!(await store.getOfflineConfig()), 'Logout retained config');
    check(!(await store.getTrustedDevice()), 'Logout retained device');
    identify('user-b');
    check((await store.getAllAttendances())[0]?.local_uuid === 'pending-b', 'Cleanup affected another owner');
    return 'PASS: real IndexedDB owner/school isolation, anonymous denial, logout cleanup, pending preservation';
  })()` });
  assert.equal(result.error, undefined, JSON.stringify(result));
  assert.equal(result.result?.exceptionDetails, undefined, JSON.stringify(result));
  console.log(result.result.result.value);
} finally {
  socket?.close();
  browser.kill();
  if (browser.exitCode === null && browser.signalCode === null) await once(browser, 'exit').catch(() => {});
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  assert.ok(path.resolve(profile).startsWith(`${path.resolve(tmpdir())}${path.sep}gakuren-idb-test-`));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
