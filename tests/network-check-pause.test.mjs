import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

test('scanner pause suppresses automatic health checks, permits manual retry, and resumes on exit', async () => {
  let paused = true, requests = 0, cleanup;
  const timers = new Map();
  let nextId = 0;
  const window = new EventTarget();
  Object.assign(window, {
    setTimeout: callback => { timers.set(++nextId, callback); return nextId; },
    clearTimeout: id => timers.delete(id),
    setInterval: () => ++nextId, clearInterval: () => {},
  });
  const context = vm.createContext({ window, AbortController, CustomEvent, Event, fetch: async () => { requests++; return { ok: false, status: 503 }; } });
  const module = new vm.SourceTextModule(await readFile('src/components/NetworkStatusMonitor.jsx', 'utf8'), { context });
  await module.link(specifier => {
    const values = specifier === 'react' ? { useEffect: fn => { cleanup = fn(); } } : specifier.includes('networkCheckPause') ? { areNetworkChecksPaused: () => paused } : specifier.includes('config/api') ? { getApiUrl: path => path } : {
      isNetworkAvailable: () => false, getScopeHeaders: () => ({}), clearNetworkOfflineFlag() {}, setNetworkAvailable() {},
    };
    return new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  });
  await module.evaluate();
  module.namespace.default();
  window.dispatchEvent(new Event('gakuren:network-verify'));
  assert.equal(timers.size, 0);
  assert.equal(requests, 0);
  window.dispatchEvent(new Event('gakuren:network-retry-now'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests, 1);
  assert.equal(timers.size, 0);
  paused = false;
  window.dispatchEvent(new Event('gakuren:network-check-pause'));
  assert.equal(timers.size, 1);
  paused = true;
  window.dispatchEvent(new Event('gakuren:network-check-pause'));
  assert.equal(timers.size, 0);
  cleanup();
});
