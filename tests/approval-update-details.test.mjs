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
  const source = await readFile("src/components/ApprovalUpdateDetails.jsx", "utf8");
  const { code } = await transformWithOxc(source, "ApprovalUpdateDetails.jsx");
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

test("update layout highlights changes and keeps unchanged values collapsed", async () => {
  const html = await render({ canCompare: true, rows: [
    { key: "name", label: "Nama", current: "Lama", value: "Baru", changed: true },
    { key: "code", label: "Kode", current: "ABC", value: "ABC", changed: false },
  ], renderValue: value => value });
  assert.match(html, /1 data berubah/);
  assert.match(html, /Saat ini/);
  assert.match(html, /Diajukan/);
  assert.ok(html.indexOf("Baru") < html.indexOf("<details"));
  assert.match(html, /Data lainnya \(1 tidak berubah\)/);
  assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/);
  assert.equal(html.split("ABC").length - 1, 1);
});

test("missing comparison data still displays all requested fields", async () => {
  const html = await render({ canCompare: false, rows: [
    { key: "name", label: "Nama", value: "Baru", changed: false },
    { key: "code", label: "Kode", value: "ABC", changed: false },
  ], renderValue: value => value });
  assert.match(html, /Baru/);
  assert.match(html, /ABC/);
  assert.doesNotMatch(html, /<details|data berubah|Saat ini/);
});
