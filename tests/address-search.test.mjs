import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
async function setup(body, status = 200) {
  const calls = [];
  const context = vm.createContext({ URL, AbortController, setTimeout, clearTimeout, window: { location: { origin: 'https://gakuren.test' } }, fetch: async (url, options) => { calls.push({ url, options }); return { ok: status === 200, status, json: async () => body }; } });
  const module = new vm.SourceTextModule(await readFile('src/services/addressSearch.js', 'utf8'), { context, initializeImportMeta: meta => { meta.env = {}; } });
  await module.link(() => {}); await module.evaluate();
  return { search: module.namespace.searchAddresses, calls };
}
test('address search maps GeoJSON longitude/latitude and caches repeated queries', async () => {
  const env = await setup({ features: [
    { geometry: { type: 'Point', coordinates: [106.8, -6.2] }, properties: { name: 'Sekolah', city: 'Jakarta', country: 'Indonesia' } },
    { geometry: { type: 'Point', coordinates: [999, 999] }, properties: { name: 'Invalid' } },
  ] });
  const items = await env.search('Sekolah Jakarta');
  assert.equal(items.length, 1); assert.equal(items[0].latitude, -6.2); assert.equal(items[0].longitude, 106.8);
  assert.equal(env.calls[0].url.searchParams.get('q'), 'Sekolah Jakarta');
  assert.equal(env.calls[0].options.credentials, 'omit');
  await env.search('  sekolah   jakarta ');
  assert.equal(env.calls.length, 1);
  await assert.rejects(env.search('Bandung'), /Tunggu/);
});
test('short queries and aborted searches do not send requests', async () => {
  const env = await setup({ features: [] });
  await assert.rejects(env.search('ab'), /minimal 3/);
  await assert.rejects(env.search('Jakarta', AbortSignal.abort()));
  assert.equal(env.calls.length, 0);
});
test('busy provider reports a readable error', async () => {
  const env = await setup({}, 429);
  await assert.rejects(env.search('Jakarta'), /sedang sibuk/);
});
