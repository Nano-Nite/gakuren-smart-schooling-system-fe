import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function resolve(result) {
  const context = vm.createContext({});
  const module = new vm.SourceTextModule(await readFile("src/utils/activeStatus.js", "utf8"), { context });
  await module.link(() => new vm.SyntheticModule(["getDailyReference"], function () {
    this.setExport("getDailyReference", async type => { assert.equal(type, "status"); return { result }; });
  }, { context }));
  await module.evaluate();
  return module.namespace.getActiveStatusUuid();
}

test("activation resolves UUID from exact active code or localized name", async () => {
  assert.equal(await resolve([{ uuid: "inactive-uuid", code: "inactive" }, { uuid: "active-uuid", code: "active" }]), "active-uuid");
  assert.equal(await resolve([{ uuid: "active-uuid", name: " Aktif " }]), "active-uuid");
});

test("missing or ambiguous active UUID never falls back to a text status", async () => {
  for (const records of [[], [{ name: "Aktif" }], [{ uuid: "a", code: "active" }, { uuid: "b", name: "Aktif" }]]) {
    await assert.rejects(resolve(records), /UUID status aktif/);
  }
});
