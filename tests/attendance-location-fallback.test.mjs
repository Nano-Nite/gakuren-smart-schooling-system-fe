import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transformWithOxc } from 'vite';
import * as defaults from '../src/utils/attendanceSessionDefaults.js';

async function setup(getLocations, geolocation) {
  const states = [], effects = [];
  let cursor = 0;
  const context = vm.createContext({ navigator: { geolocation }, AbortController, Date });
  const { code } = await transformWithOxc(await readFile('src/components/attendance/AttendanceSessionForm.jsx', 'utf8'), 'AttendanceSessionForm.jsx');
  const module = new vm.SourceTextModule(code, { context });
  const react = {
    useState: initial => {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    },
    useRef: initial => {
      const index = cursor++;
      return states[index] ||= { current: initial };
    },
    useEffect: effect => { const index = cursor++; if (!(index in states)) { states[index] = true; effects.push(effect); } },
    jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }),
  };
  await module.link(specifier => {
    const values = specifier.includes('attendanceSessionDefaults') ? defaults : specifier.includes('attendanceService') ? { attendanceService: { getLocations } } : specifier.startsWith('.') ? { default: specifier } : react;
    return new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  });
  await module.evaluate();
  const submitted = [];
  const render = () => { cursor = 0; return module.namespace.default({ allowed: true, loading: false, onSubmit: value => submitted.push(value) }); };
  render();
  effects.forEach(effect => effect());
  await new Promise(resolve => setImmediate(resolve));
  return { render, submitted };
}

for (const empty of [false, true]) test(`device coordinates replace UUID when locations ${empty ? 'are empty' : 'fail'}`, async () => {
  const app = await setup(async () => { if (empty) return []; throw new Error('Unavailable'); }, {
    getCurrentPosition: success => success({ coords: { latitude: -6.2, longitude: 106.8, accuracy: 12 } }),
  });
  app.render().props.onSubmit({ preventDefault() {} });
  assert.equal(app.submitted.length, 1);
  assert.equal(app.submitted[0].latitude, -6.2);
  assert.equal(app.submitted[0].longitude, 106.8);
  assert.equal(app.submitted[0].accuracy, 12);
  assert.equal('location_uuid' in app.submitted[0], false);
});

test('denied device location does not submit a session', async () => {
  const app = await setup(async () => [], { getCurrentPosition: (_, fail) => fail({ code: 1 }) });
  app.render().props.onSubmit({ preventDefault() {} });
  assert.equal(app.submitted.length, 0);
});

test('backend locations retain UUID and never request device location', async () => {
  const app = await setup(async () => [{ uuid: 'school', name: 'School' }], { getCurrentPosition: () => assert.fail('Unexpected geolocation request') });
  app.render().props.onSubmit({ preventDefault() {} });
  assert.equal(app.submitted[0].location_uuid, 'school');
  assert.equal('latitude' in app.submitted[0], false);
});
