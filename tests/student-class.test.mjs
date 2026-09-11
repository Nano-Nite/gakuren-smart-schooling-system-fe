import test from "node:test";
import assert from "node:assert/strict";
import { resolveStudentClass } from "../src/utils/resolveStudentClass.js";
import { buildStudentUpdatePayload } from "../src/utils/studentUpdatePayload.js";

test("unchanged class with only a name resolves across pages for update", async () => {
  const form = { name: "Siswa", nis: "1234", nisn: "1234567890", phone: "081234567890", email: "siswa@example.com", address: "Jalan Sekolah", gender_uuid: "gender-1", class_name: "VII A", class_uuid: "" };
  const resolved = await resolveStudentClass(form, async body => ({ data: {
    result: body.page === 1 ? [{ uuid: "other", name: "VII AB" }] : [{ UUID: "class-1", Name: "VII A" }],
    data_statistic: { max_page: 2 },
  } }));
  assert.equal(buildStudentUpdatePayload(resolved, "student-1").class_uuid, "class-1");
});

test("existing selection and explicitly cleared class do not trigger lookup", async () => {
  for (const form of [{ class_uuid: "class-1", class_name: "VII A" }, { class_uuid: "", class_name: "" }]) {
    assert.equal(await resolveStudentClass(form, () => assert.fail("Unexpected lookup")), form);
  }
});

test("missing and ambiguous class names require explicit selection", async () => {
  for (const result of [[], [{ uuid: "a", name: "VII A" }, { uuid: "b", name: "VII A" }]]) {
    await assert.rejects(resolveStudentClass({ class_name: "VII A" }, async () => ({ data: { result } })), /Pilih kembali kelas/);
  }
});
