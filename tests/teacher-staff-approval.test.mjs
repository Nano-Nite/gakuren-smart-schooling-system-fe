import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import * as referenceResolver from "../src/utils/resolveApprovalReference.js";
import * as React from "react";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { transformWithOxc } from "vite";
import { formatTeacherStaffDate } from "../src/utils/teacherStaffData.js";

async function render(props) {
  const source = await readFile("src/components/TeacherStaffApprovalDetails.jsx", "utf8");
  const { code } = await transformWithOxc(source, "TeacherStaffApprovalDetails.jsx");
  const context = vm.createContext({ console });
  const module = new vm.SourceTextModule(code, { context });
  await module.link(specifier => {
    const exports = specifier === "react" ? React : specifier === "react/jsx-runtime" ? runtime : specifier.includes("resolveApprovalReference") ? referenceResolver : specifier.includes("teacherStaffData") ? { formatTeacherStaffDate } : { getDailyReference: () => Promise.resolve({ result: [] }) };
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  return renderToStaticMarkup(React.createElement(module.namespace.default, props));
}

test("teacher approval presents nested fields as readable biodata and education", async () => {
  const html = await render({ requestData: {
    biodata: { full_name: "Nama Guru", birth_date: "1995-08-20T00:00:00Z" },
    titles: [{ uuid: "private-id", sequence: 0, is_prefix: false }],
    education_level: [{ institution_name: "Universitas A", start_year: 2013, end_year: 2017, last_education: true }],
  } });
  assert.match(html, /Nama Guru/);
  assert.match(html, /20 Agustus 1995/);
  assert.match(html, /Universitas A/);
  assert.match(html, /Tahun masuk/);
  assert.match(html, /Pendidikan terakhir/);
  assert.doesNotMatch(html, /0 - false|private-id|1995-08-20T/);
});

test("update approval compares nested request biodata with flat active data", async () => {
  const html = await render({ isUpdate: true, requestData: { biodata: { full_name: "Nama Baru" } }, activeData: { name: "Nama Lama" } });
  assert.match(html, /Saat ini/);
  assert.match(html, /Diajukan/);
  assert.match(html, /Nama Lama/);
  assert.match(html, /Nama Baru/);
  assert.match(html, /Berubah/);
});


test("gender and employee status prefer full names over reference codes", async () => {
  const html = await render({ requestData: {
    gender: { uuid: "gender-id", code: "L", name: "Laki-laki" },
    employee_status: { uuid: "status-id", code: "employee_gty", name: "Guru Tetap Yayasan" },
    titles: [{ uuid: "title-id", abbr_name: "Gr.", name: "Guru" }],
  } });
  assert.match(html, /Laki-laki/);
  assert.match(html, /Guru Tetap Yayasan/);
  assert.match(html, /Gr\./);
  assert.doesNotMatch(html, /employee_gty|>L</);
});


test("approval positions display full names instead of abbreviations", async () => {
  const html = await render({ requestData: {
    positions: [
      { uuid: "position-one", code: "GR", name: "Guru" },
      { uuid: "position-two", abbr_name: "GK", name: "Guru Kelas" },
    ],
  } });
  assert.match(html, /Guru Kelas/);
  assert.match(html, />Guru</);
  assert.doesNotMatch(html, />GR<|>GK</);
});

test("update details prioritize changes and collapse unchanged data without repeating values", async () => {
  const html = await render({ isUpdate: true, requestData: { biodata: { full_name: "Nama Baru", email: "guru@sekolah.id" } }, activeData: { name: "Nama Lama", email: "guru@sekolah.id" } });
  assert.match(html, /1 data berubah/);
  assert.match(html, /<details class=/);
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/);
  assert.match(html, /Data lainnya \(1 tidak berubah\)/);
  assert.equal(html.split("guru@sekolah.id").length - 1, 1);
  assert.ok(html.indexOf("Nama Baru") < html.indexOf("<details"));
});

test("create details show all fields without comparison controls or input-like cards", async () => {
  const html = await render({ requestData: { biodata: { full_name: "Nama Guru", email: "guru@sekolah.id" }, nip: "123" } });
  assert.match(html, /Nama Guru/);
  assert.match(html, /guru@sekolah.id/);
  assert.match(html, /123/);
  assert.doesNotMatch(html, /<details|Saat ini|<input|<textarea/);
});
