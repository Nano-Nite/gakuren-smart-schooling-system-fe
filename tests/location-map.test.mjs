import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transformWithOxc } from 'vite';

async function setup() {
  const effects = [], refs = [], changes = [];
  let index = 0, disconnected = false;
  const layer = () => ({ events: {}, on(name, fn) { this.events[name] = fn; return this; }, off() {}, addTo() { this.visible = true; return this; }, remove() { this.visible = false; return this; }, setLatLng(value) { this.point = value; return this; }, setRadius(value) { this.radius = value; return this; }, getBounds() { return {}; }, dragging: { enable() { this.enabled = true; }, disable() { this.enabled = false; } } });
  const map = { ...layer(), setView() { return this; }, fitBounds() {}, invalidateSize() {} };
  const marker = layer(), circle = layer(), tiles = layer();
  const leaflet = { icon: () => ({}), map: () => map, tileLayer: () => tiles, marker: () => marker, circle: () => circle };
  const context = vm.createContext({ ResizeObserver: class { observe() {} disconnect() { disconnected = true; } } });
  const { code } = await transformWithOxc(await readFile('src/components/LocationMap.jsx', 'utf8'), 'LocationMap.jsx');
  const module = new vm.SourceTextModule(code, { context });
  await module.link(name => {
    const values = name === 'react' ? {
      useRef: initial => refs[index++] ||= { current: initial },
      useState: initial => [initial, () => {}],
      useEffect: fn => effects.push(fn),
    } : name === 'react/jsx-runtime' ? { jsx: () => null, jsxs: () => null } : name.endsWith('.css') ? {} : { default: name === 'leaflet' ? leaflet : '' };
    return new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  });
  await module.evaluate();
  const render = props => { index = 0; effects.length = 0; module.namespace.default({ latitude: -6.2, longitude: 106.8, radius: 100, editable: true, onChange: value => changes.push(value), ...props }); };
  render();
  const cleanup = effects[0](); effects[1]();
  return { map, marker, circle, changes, cleanup, disconnected: () => disconnected, update: props => { render(props); effects[1](); } };
}

test('map synchronizes coordinates and radius, respects read-only access and cleans up', async () => {
  const env = await setup();
  assert.deepEqual(Array.from(env.marker.point), [-6.2, 106.8]);
  assert.equal(env.circle.radius, 100);
  const point = { wrap: () => ({ lat: -6.3, lng: 106.9 }) };
  env.map.events.click({ latlng: point });
  assert.equal(env.changes[0].latitude, '-6.300000');
  env.marker.getLatLng = () => point;
  env.marker.events.dragend();
  assert.equal(env.changes.length, 2);
  env.update({ editable: false, radius: 500 });
  assert.equal(env.circle.radius, 500);
  assert.equal(env.marker.dragging.enabled, false);
  env.map.events.click({ latlng: point });
  assert.equal(env.changes.length, 2);
  env.update({ latitude: null, longitude: null });
  assert.equal(env.marker.visible, false);
  assert.equal(env.circle.visible, false);
  env.cleanup();
  assert.equal(env.disconnected(), true);
  assert.equal(env.map.visible, false);
});
