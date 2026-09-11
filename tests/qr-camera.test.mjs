import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function decoder() {
  const source = await readFile('node_modules/qr-scanner/qr-scanner-worker.min.js', 'utf8');
  let workerSource;
  const loader = vm.createContext({ Blob: class { constructor(parts) { workerSource = parts.join(''); } }, URL: { createObjectURL() { return 'worker'; } }, Worker: class {} });
  vm.runInContext(source.replace('export const createWorker=', 'const createWorker=') + '\ncreateWorker();', loader);
  const replies = [];
  const self = { postMessage: value => replies.push(value) };
  vm.runInContext(workerSource, vm.createContext({ self, Uint8ClampedArray }));
  self.onmessage({ data: { type: 'inversionMode', data: 'both' } });
  return pixels => {
    self.onmessage({ data: { id: 1, type: 'decode', data: pixels } });
    return replies.at(-1).data;
  };
}

async function qrPixels(text, dark, light) {
  const source = await readFile('node_modules/qrcode.react/lib/esm/index.js', 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source.slice(source.indexOf('var qrcodegen;'), source.indexOf('// src/index.tsx', source.indexOf('var qrcodegen;'))), context);
  const qr = context.qrcodegen.QrCode.encodeText(text, context.qrcodegen.QrCode.Ecc.MEDIUM);
  const scale = 5, margin = 4, width = (qr.size + margin * 2) * scale;
  const data = new Uint8ClampedArray(width * width * 4);
  for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
    const level = qr.getModule(Math.floor(x / scale) - margin, Math.floor(y / scale) - margin) ? dark : light;
    const offset = (y * width + x) * 4;
    data[offset] = data[offset + 1] = data[offset + 2] = level;
    data[offset + 3] = 255;
  }
  return { data, width, height: width };
}

for (const [label, dark, light] of [['normal', 0, 255], ['dim', 15, 95], ['low contrast', 110, 165], ['inverted', 240, 15]]) {
  test(`bundled offline decoder reads a generated ${label} QR`, async () => {
    const decode = await decoder();
    const token = 'gakuren-scanner-test-2026';
    assert.equal(decode(await qrPixels(token, dark, light)), token);
  });
}

test('camera adapter ignores late decodes after stopping and tolerates rejected exposure settings', async () => {
  let instance;
  class Scanner {
    constructor(video, callback, options) { instance = this; this.callback = callback; this.options = options; }
    setInversionMode(value) { this.inversion = value; }
    async start() {}
    destroy() { this.destroyed = true; }
  }
  const module = new vm.SourceTextModule(await readFile('src/utils/qrCamera.js', 'utf8'), { context: vm.createContext({}) });
  await module.link(() => new vm.SyntheticModule(['default'], function () { this.setExport('default', Scanner); }, { context: module.context }));
  await module.evaluate();
  const results = [];
  const track = { getCapabilities: () => ({ focusMode: ['continuous'], exposureMode: ['continuous'] }), applyConstraints: async () => { throw new Error('Unsupported combination'); } };
  const camera = module.namespace.createQrCamera({ srcObject: { getVideoTracks: () => [track] } }, value => results.push(value));
  await camera.start();
  assert.equal(instance.options.preferredCamera, 'environment');
  assert.equal(instance.inversion, 'both');
  instance.callback({ data: 'first' });
  camera.stop();
  instance.callback({ data: 'late' });
  assert.deepEqual(results, ['first']);
  assert.ok(instance.destroyed);
});
