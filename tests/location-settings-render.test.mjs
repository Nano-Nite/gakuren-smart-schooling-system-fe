import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";
import * as React from "react";
import * as runtime from "react/jsx-runtime";
import * as icons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

async function render(permissions) {
  const filename = "src/pages/LocationSettings.jsx";
  const { code } = await transformWithOxc(await readFile(filename, "utf8"), filename);
  const context = vm.createContext({});
  const imports = {
    "../components/LocationMap": { default: () => runtime.jsx("div", { "aria-label": "Peta lokasi absensi" }) },
    "../components/AddressSearch": { default: () => null },
    react: React,
    "react/jsx-runtime": runtime,
    "lucide-react": icons,
    "../services/attendanceService": { attendanceService: {} },
    "../utils/permissions": { getMenuPermissions: () => permissions },
  };
  const module = new vm.SourceTextModule(code, { context });
  await module.link(name => {
    const values = imports[name];
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return renderToStaticMarkup(runtime.jsx(module.namespace.default, {}));
}

test("location settings renders QR configuration with unavailable server save clearly indicated", async () => {
  const html = await render(["setting.location.view", "setting.location.create"]);
  assert.match(html, /Lokasi absensi/);
  assert.match(html, /Pratinjau jangkauan/);
  assert.match(html, /Gunakan lokasi saya/);
  assert.match(html, /Penyimpanan lokasi belum tersedia/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Simpan lokasi/);
  assert.doesNotMatch(html, /href="https:\/\/www.google.com/);
});

test("read-only location permission does not offer create or save actions", async () => {
  const html = await render(["setting.location.view"]);
  assert.doesNotMatch(html, /Tambah lokasi|Simpan lokasi/);
  assert.match(html, /disabled=""[^>]*placeholder="Contoh:/);
});
