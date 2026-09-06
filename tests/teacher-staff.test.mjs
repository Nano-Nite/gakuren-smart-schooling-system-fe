import test from "node:test";
import assert from "node:assert/strict";
import { buildTeacherStaffPayload, getTeacherStaffCreateOutcome } from "../src/utils/teacherStaffPayload.js";

const form = {
  name: " Teacher ", email: "teacher@example.com", phone: "081212121213",
  gender_uuid: "gender", birth_place: " Jakarta ", birth_date: "1995-08-20", address: " Address ",
  educations: [{ is_last_education: true, institution: " University ", education_level_uuid: "level", major: "", enrollment_year: "2013", graduation_year: "2017" }],
  role: "teacher", position_uuids: ["position"], title_prefix_uuids: ["title"], title_suffix_uuids: ["title", "suffix"],
  subject_uuids: ["subject"], nik: "3210000000000001", nuptk: "1234567890123456", nip: "198609262015051001",
  join_date: "2026-12-06", resign_date: "", employment_status_uuid: "employee-status",
};

test("teacher payload follows the create contract without UI fields", () => {
  assert.deepEqual(buildTeacherStaffPayload(form), {
    biodata: { full_name: "Teacher", email: form.email, phone: form.phone, gender_uuid: "gender", birth_place: "Jakarta", birth_date: "1995-08-20T00:00:00Z", address: "Address" },
    education_level: [{ last_education: true, institution_name: "University", education_level_uuid: "level", major: null, start_year: 2013, end_year: 2017 }],
    positions: [{ uuid: "position" }], titles: [{ uuid: "title" }, { uuid: "suffix" }], subjects: [{ uuid: "subject" }],
    employee_status_uuid: "employee-status",
    is_staff: false, img_location: null, nik: form.nik, nuptk: form.nuptk, nip: form.nip,
    join_date: "2026-12-06T00:00:00Z", resign_date: null,
  });
});

test("staff discards teacher-only values and preserves staff identifiers", () => {
  const payload = buildTeacherStaffPayload({ ...form, role: "staff", nip: "" });
  assert.equal(payload.is_staff, true);
  assert.equal(payload.employee_status_uuid, "employee-status");
  assert.equal(payload.subjects, null);
  assert.equal(payload.nuptk, null);
  assert.equal(payload.nik, form.nik);
  assert.equal(payload.nip, null);
  assert.deepEqual(buildTeacherStaffPayload({ ...form, subject_uuids: [] }).subjects, []);
});

test("approval and active outcomes are distinguished; UUID alone does not imply active", () => {
  for (const data of [{ status: "pending" }, { approval_uuid: "approval" }, { is_pending: true }]) {
    assert.equal(getTeacherStaffCreateOutcome({ data }).pending, true);
  }
  assert.match(getTeacherStaffCreateOutcome({ data: { status: "active" } }).message, /berhasil dibuat/);
  assert.match(getTeacherStaffCreateOutcome({ data: { uuid: "created" }, error: null, message: "success" }).message, /Status terbaru dimuat dari server/);
});
