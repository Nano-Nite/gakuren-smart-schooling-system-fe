import test from "node:test";
import assert from "node:assert/strict";
import { resolveApprovalReference } from "../src/utils/resolveApprovalReference.js";

test("missing UUID refreshes once and resolves its label", async () => {
  const calls = [];
  const fetch = async (type, options) => {
    calls.push(options.forceRefresh);
    return { result: options.forceRefresh ? [{ uuid: "title", abbr_name: "Gr." }] : [] };
  };
  const response = await resolveApprovalReference(fetch, "title", {}, ["title"]);
  assert.deepEqual(calls, [undefined, true]);
  assert.equal(response.result[0].abbr_name, "Gr.");
  assert.equal(response.failed, false);
});

test("complete cache requires no refresh", async () => {
  let calls = 0;
  await resolveApprovalReference(async () => { calls++; return { result: [{ uuid: "title", name: "Guru" }] }; }, "title", {}, ["title"]);
  assert.equal(calls, 1);
});

test("missing records after refresh do not cause a retry loop", async () => {
  let calls = 0;
  const response = await resolveApprovalReference(async () => { calls++; return { result: [] }; }, "title", {}, ["missing"]);
  assert.equal(calls, 2);
  assert.equal(response.failed, false);
  calls = 0;
  await resolveApprovalReference(async () => { calls++; return { result: [] }; }, "title", { forceRefresh: true }, ["missing"]);
  assert.equal(calls, 2);
});

test("refresh failure retains available labels and reports failure", async () => {
  const response = await resolveApprovalReference(async (type, options) => {
    if (options.forceRefresh) throw new Error("Offline");
    return { result: [{ uuid: "known", name: "Known" }] };
  }, "title", {}, ["missing"]);
  assert.equal(response.failed, true);
  assert.equal(response.result[0].uuid, "known");
});

test("cancellation is propagated", async () => {
  await assert.rejects(resolveApprovalReference(async () => { throw new DOMException("Aborted", "AbortError"); }, "title", {}, []), { name: "AbortError" });
});

test("title lookup requests missing UUIDs separately and preserves existing entries", async () => {
  const calls = [];
  const result = await resolveApprovalReference(async (type, options) => {
    calls.push(options);
    return { result: options.uuid ? [{ uuid: options.uuid, abbr_name: "Gr." }] : [{ uuid: "existing", name: "Doktor" }] };
  }, "title", {}, ["existing", "missing", "missing"]);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].uuid, "missing");
  assert.equal(calls[1].forceRefresh, true);
  assert.deepEqual(result.result.map(item => item.uuid), ["existing", "missing"]);
});
