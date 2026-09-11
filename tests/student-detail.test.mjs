import test from "node:test";
import assert from "node:assert/strict";
import { getStudentDetail } from "../src/utils/studentDetail.js";
import { buildStudentUpdatePayload } from "../src/utils/studentUpdatePayload.js";

const detail = { UUID: "student-1", Name: "Siswa", NIS: "1234", NISN: "1234567890", PhoneNumber: "081234567890", Email: "siswa@example.com", ClassUUID: "class-1", Address: "Jalan Sekolah", GenderUUID: "gender-1", ParentName: "Wali", ParentEmail: "wali@example.com", ParentPhone: "081234567891", ParentAddress: "Jalan Sekolah" };

test("activation detail supports direct objects and existing API response envelopes", () => {
  for (const payload of [detail, [detail], { result: detail }, { result: [{ ...detail, UUID: "other" }, detail] }, { instance: detail }, { data: { result: [detail] } }]) {
    const result = getStudentDetail(payload, "student-1");
    const update = buildStudentUpdatePayload(result, result.uuid);
    assert.equal(update.uuid, "student-1");
    assert.equal(update.class_uuid, "class-1");
    assert.equal(update.gender_uuid, "gender-1");
    assert.equal(update.parent_email, "wali@example.com");
    assert.equal(update.phone, "081234567890");
    assert.deepEqual(getStudentDetail(update, "student-1"), result);
  }
});

test("activation rejects missing, mismatched and duplicate identities", () => {
  for (const payload of [null, {}, { ...detail, UUID: "other" }, { result: [detail, detail] }, { ...detail, UUID: undefined }]) {
    assert.throws(() => getStudentDetail(payload, "student-1"), /tidak ditemukan atau tidak unik/);
  }
});

test("incomplete detail still cannot be submitted as a full student update", () => {
  const result = getStudentDetail({ uuid: "student-1", name: "Siswa" }, "student-1");
  assert.throws(() => buildStudentUpdatePayload(result, result.uuid), /belum lengkap/);
});
