import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import * as detailUtils from "../src/utils/studentDetail.js";
import * as payloadUtils from "../src/utils/studentUpdatePayload.js";
import * as classUtils from "../src/utils/resolveStudentClass.js";
import * as genderUtils from "../src/utils/resolveStudentGender.js";

test("activation resolves IDs from the backend detail response containing only class and gender names", async () => {
  const detail = { uuid: "student-1", user_uuid: "user-1", name: "Siswa", nis: "123456", nisn: "1234567890", class_name: "Al-Fatih", phone: "081234567890", email: "siswa@example.com", gender_name: "Laki-Laki", status: "Inactive", student_status: "Tidak Aktif", address: "Jalan Sekolah", parent_name: "Wali", parent_email: "wali@example.com", parent_phone: "081234567891", parent_address: "Jalan Sekolah" };
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, ...options });
    if (options.method === "GET") return { data: detail, error: null, message: "success" };
    return { data: { result: [{ uuid: "class-1", name: "Al-Fatih" }] } };
  };
  const imports = {
    "../config/api": { default: { GET_STUDENTS: "/student/get", GET_CLASSES: "/class/get" } },
    "./api": { authenticatedRequest: request },
    "./studentDetail": detailUtils, "./studentUpdatePayload": payloadUtils,
    "./resolveStudentClass": classUtils, "./resolveStudentGender": genderUtils,
    "./dailyReferenceCache": { getDailyReference: async type => { assert.equal(type, "gender"); return { result: [{ UUID: "gender-1", Name: "Laki-laki" }] }; } },
  };
  const context = vm.createContext({});
  const module = new vm.SourceTextModule(await readFile("src/utils/studentActivation.js", "utf8"), { context });
  await module.link(specifier => new vm.SyntheticModule(Object.keys(imports[specifier]), function () {
    for (const [key, value] of Object.entries(imports[specifier])) this.setExport(key, value);
  }, { context }));
  await module.evaluate();
  const payload = await module.namespace.buildStudentActivationPayload({ id: "student-1" }, "status-active");
  assert.equal(payload.uuid, "student-1");
  assert.equal(payload.class_uuid, "class-1");
  assert.equal(payload.gender_uuid, "gender-1");
  assert.equal(payload.status, "status-active");
  assert.equal(payload.parent_email, detail.parent_email);
  assert.equal(payload.class_name, undefined);
  assert.equal(calls[0].url, "/student/get?uuid=student-1");
  assert.equal(calls[1].body.search, "Al-Fatih");
});

test("gender lookup preserves an existing UUID and rejects absent or ambiguous matches", async () => {
  const existing = { gender_uuid: "gender-1" };
  assert.equal(await genderUtils.resolveStudentGender(existing, () => assert.fail("Unexpected lookup")), existing);
  for (const result of [[], [{ code: "L", name: "Laki-Laki" }], [{ uuid: "a", name: "Laki-Laki" }, { uuid: "b", name: "Laki-Laki" }]]) {
    await assert.rejects(genderUtils.resolveStudentGender({ gender_name: "Laki-Laki" }, async () => ({ result })), /belum dapat dipastikan/);
  }
});
