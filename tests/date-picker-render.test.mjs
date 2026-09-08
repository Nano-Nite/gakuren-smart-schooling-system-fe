import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";

async function renderDatePicker(props) {
  const source = await readFile("src/components/DatePicker.jsx", "utf8");
  const { code } = await transformWithOxc(source, "DatePicker.jsx");
  const context = vm.createContext({ console });
  const noop = () => {};
  const overrides = {
    useState: initial => [typeof initial === "function" ? initial() : initial, noop],
    useEffect: noop,
    useRef: value => ({ current: value }),
    useMemo: callback => callback(),
    useCallback: callback => callback,
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  };
  const module = new vm.SourceTextModule(code, { context });
  await module.link(specifier => {
    const names = specifier === "react/jsx-runtime" ? ["jsx", "jsxs", "Fragment"]
      : [...source.matchAll(/import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];/g)]
        .filter(match => match[2] === specifier)
        .flatMap(match => match[1].startsWith("{") ? match[1].replace(/[{}]/g, "").split(",").map(name => name.trim()) : ["default"]);
    return new vm.SyntheticModule(names, function () {
      for (const name of names) this.setExport(name, overrides[name] || noop);
    }, { context });
  });
  await module.evaluate();
  return JSON.stringify(module.namespace.default({ onChange: noop, ...props }));
}

test("date picker renders API timestamps with the same calendar date as date-only values", async () => {
  const expected = await renderDatePicker({ value: "1995-08-20" });
  assert.match(expected, /20 Agustus 1995/);
  for (const value of ["1995-08-20T00:00:00Z", "1995-08-20T00:00:00.000Z", "1995-08-20T00:00:00+07:00"]) {
    assert.equal(await renderDatePicker({ value }), expected);
  }
});

test("date picker renders a placeholder for missing or invalid dates", async () => {
  for (const value of [null, "", "invalid", "2026-02-30"]) {
    assert.match(await renderDatePicker({ value, min: "invalid", max: "invalid" }), /Pilih tanggal/);
  }
});
