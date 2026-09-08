import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";

async function renderWithForm(form) {
  const source = await readFile("src/pages/TeacherStaffManagement.jsx", "utf8");
  const { code } = await transformWithOxc(source, "TeacherStaffManagement.jsx");
  const noop = () => {};
  const context = vm.createContext({ console, AbortController, setTimeout, clearTimeout });
  const overrides = {
    useState: initial => [typeof initial === "function" ? form : initial, noop],
    useEffect: noop,
    useRef: value => ({ current: value }),
    useStepTransition: () => ({ createStep: 1, displayedStep: 1 }),
    getCrudPermissions: () => ({ canView: true }),
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
      for (const name of names) this.setExport(name, overrides[name] || (specifier.includes("useActivateData") ? () => ({ submitting: false, error: "", activate: noop, clearError: noop }) : specifier.includes("useStepTransition") ? overrides.useStepTransition : noop));
    }, { context });
  });
  await module.evaluate();
  return module.namespace.default();
}

test("detail render does not evaluate the create wizard with a table row lacking educations", async () => {
  assert.ok(await renderWithForm({ id: "teacher-id", name: "Teacher", status: "New User" }));
});

test("detail render accepts nullable education history without running create validation", async () => {
  assert.ok(await renderWithForm({ id: "staff-id", name: "Staff", educations: null }));
});
