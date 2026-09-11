import test from "node:test";
import assert from "node:assert/strict";
import { notify, dismissNotification, clearNotifications, getNotifications, subscribeNotifications } from "../src/utils/notifications.js";

test("notification stack retains the latest three messages, including repeated messages", () => {
  clearNotifications();
  const ids = [1, 2, 3, 4].map(() => notify("Pengajuan berhasil dikirim", { tone: "pending" }));
  assert.deepEqual(getNotifications().map(item => item.id), ids.slice(1));
  assert.equal(new Set(ids).size, 4);
  assert.ok(getNotifications().every(item => item.tone === "pending"));
  clearNotifications();
});

test("closing one notification preserves the others and notifies subscribed UI", () => {
  clearNotifications();
  let updates = 0;
  const unsubscribe = subscribeNotifications(() => { updates += 1; });
  const first = notify("Siswa diperbarui");
  const second = notify("Kelas diperbarui");
  dismissNotification(first);
  assert.deepEqual(getNotifications().map(item => item.id), [second]);
  assert.equal(updates, 3);
  unsubscribe();
  clearNotifications();
  assert.equal(updates, 3);
  assert.equal(getNotifications().length, 0);
});
