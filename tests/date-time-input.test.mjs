import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";

async function load(name) {
  const source = await readFile(`src/components/${name}.jsx`, "utf8");
  const { code } = await transformWithOxc(source, `${name}.jsx`);
  const context = vm.createContext({ console });
  const module = new vm.SourceTextModule(code, { context });
  const exports = {
    useState: initial => [typeof initial === "function" ? initial() : initial, () => {}],
    useEffect: () => {}, useRef: () => ({ current: undefined }),
    jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }),
  };
  await module.link(specifier => {
    const values = specifier.startsWith(".") ? { default: specifier } : exports;
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace.default;
}

test("date and time modes reuse the shared pickers", async () => {
  const Input = await load("DateTimeInput");
  assert.equal(Input({ type: "date" }).type, "./DatePicker");
  assert.equal(Input({ type: "time" }).type, "./TimePicker");
});

test("local datetime edits retain the other part and apply time bounds only on the boundary date", async () => {
  const Input = await load("DateTimeInput");
  const changes = [];
  const props = { type: "datetime-local", value: "2026-09-11T09:30", min: "2026-09-11T08:45", onChange: value => changes.push(value) };
  const children = Input(props).props.children;
  assert.equal(children[1].props.min, "2026-09-11");
  assert.equal(children[2].props.min, "08:45");
  children[1].props.onChange("2026-09-12");
  children[2].props.onChange("10:15");
  assert.deepEqual(changes, ["2026-09-12T09:30", "2026-09-11T10:15"]);
  assert.equal(Input({ ...props, value: "2026-09-12T09:30" }).props.children[2].props.min, undefined);
});

test("time selection respects minute bounds and adjusts minutes when changing hours", async () => {
  const Picker = await load("TimePicker");
  let changed;
  const tree = Picker({ value: "09:10", min: "08:45", max: "09:20", onChange: value => { changed = value; } });
  const [hours, , minutes] = tree.props.children[1].props.children;
  assert.deepEqual(Array.from(hours.props.options.slice(1)), ["08", "09"]);
  assert.equal(minutes.props.options.at(-1), "20");
  hours.props.onChange("08");
  assert.equal(changed, "08:45");
  minutes.props.onChange("15");
  assert.equal(changed, "09:15");
});
