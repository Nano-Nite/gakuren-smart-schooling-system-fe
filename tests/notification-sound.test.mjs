import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function load({ blocked = false, failed = false } = {}) {
  const counts = { contexts: 0, fetches: 0, decodes: 0, plays: 0 };
  class AudioContext {
    constructor() { counts.contexts += 1; this.state = "suspended"; }
    async resume() { if (blocked) throw new Error("NotAllowedError"); this.state = "running"; }
    async decodeAudioData() { counts.decodes += 1; return {}; }
    createBufferSource() { return { connect() {}, disconnect() {}, stop() {}, start() { counts.plays += 1; } }; }
  }
  const context = vm.createContext({ window: { AudioContext }, fetch: async () => {
    counts.fetches += 1;
    return { ok: !failed, arrayBuffer: async () => new ArrayBuffer(0) };
  } });
  const module = new vm.SourceTextModule(await readFile("src/utils/notificationSound.js", "utf8"), { context });
  await module.link(() => new vm.SyntheticModule(["default"], function () { this.setExport("default", "/notification.mp3"); }, { context }));
  await module.evaluate();
  return { sound: module.namespace, counts };
}

test("notification audio loads lazily once and reuses decoded data without replaying older IDs", async () => {
  const { sound, counts } = await load();
  assert.equal(counts.contexts, 0);
  sound.unlockNotificationSound();
  sound.unlockNotificationSound();
  assert.equal(counts.fetches, 0);
  await sound.playNotificationSound(1);
  await sound.playNotificationSound(2);
  await sound.playNotificationSound(2);
  await sound.playNotificationSound(1);
  assert.deepEqual(counts, { contexts: 1, fetches: 1, decodes: 1, plays: 2 });
});

test("concurrent notifications share one load and play only the latest sound", async () => {
  const { sound, counts } = await load();
  await Promise.all([sound.playNotificationSound(1), sound.playNotificationSound(2)]);
  assert.deepEqual(counts, { contexts: 1, fetches: 1, decodes: 1, plays: 1 });
});

test("autoplay restrictions and failed downloads do not reject notification playback", async () => {
  for (const options of [{ blocked: true }, { failed: true }]) {
    const { sound, counts } = await load(options);
    await sound.playNotificationSound(1);
    await sound.playNotificationSound(2);
    assert.equal(counts.plays, 0);
    assert.equal(counts.fetches, 1);
  }
});
