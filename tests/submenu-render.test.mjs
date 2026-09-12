import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

async function renderSubmenu(props, children = ["Device", "Location"]) {
  const context = vm.createContext({});
  const labels = { Setting: "Pengaturan", Device: "Perangkat", Location: "Lokasi" };
  let Content;
  const stubs = {
    "./LocationSettings": { default: () => jsxRuntime.jsx("h2", { children: "Lokasi" }) },
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": { Monitor: () => null, MapPin: () => null, Settings: () => null, Construction: () => null, LockKeyhole: () => null, ShieldAlert: () => null },
    "react-helmet-async": { Helmet: () => null },
    "react-router-dom": {
      useLocation: () => ({ pathname: props.child ? `/settings/${props.child.toLowerCase()}` : "/settings" }),
      Outlet: () => jsxRuntime.jsx(Content, props),
      NavLink: ({ children, to, ...props }) => jsxRuntime.jsx("a", { ...props, href: to, children }) },
    "../context/LocaleContext": { useLocale: () => ({ t: (key, fallback) => labels[key.split(".")[1]] || fallback }) },
    "../utils/permissions": {
      CHILD_MENUS: { Setting: { Device: { route: "/settings/device" }, Location: { route: "/settings/location" } } },
      getMenuChildren: () => children,
      hasChildMenuAccess: () => true,
    },
  };
  async function load(name) {
    const filename = `src/pages/${name}.jsx`;
    const { code } = await transformWithOxc(await readFile(filename, "utf8"), filename);
    const module = new vm.SourceTextModule(code, { context });
    await module.link(specifier => {
      if (!stubs[specifier]) return load(specifier.replace("./", ""));
      const exports = stubs[specifier];
      return new vm.SyntheticModule(Object.keys(exports), function () {
        for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
      }, { context });
    });
    return module;
  }
  const module = await load("SubmenuPage");
  await module.evaluate();
  Content = module.namespace.SubmenuContent;
  return renderToStaticMarkup(jsxRuntime.jsx(module.namespace.default, props));
}

test("parent and child pages render translated content and submenu navigation", async () => {
  for (const [props, title] of [
    [{ parent: "Setting" }, "Perangkat"],
    [{ parent: "Setting", child: "Device" }, "Perangkat"],
    [{ parent: "Setting", child: "Location" }, "Lokasi"],
  ]) {
    const html = await renderSubmenu(props);
    assert.match(html, /Submenu Pengaturan/);
    assert.match(html, /href="\/settings\/device"/);
    assert.match(html, /href="\/settings\/location"/);
    assert.match(html, new RegExp(`<h2[^>]*>${title}</h2>`));
  }
});

test("parent without children renders its translated placeholder", async () => {
  assert.match(await renderSubmenu({ parent: "Setting" }, []), /<h2[^>]*>Pengaturan<\/h2>/);
});
