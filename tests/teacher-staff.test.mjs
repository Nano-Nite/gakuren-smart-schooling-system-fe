import test from "node:test";
import assert from "node:assert/strict";
import { buildTeacherStaffPayload, buildTeacherStaffUpdatePayload, getTeacherStaffCreateOutcome } from "../src/utils/teacherStaffPayload.js";

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

test("update payload includes both identities and employee_status without email", () => {
  const payload = buildTeacherStaffUpdatePayload({ ...form, uuid: "user-id", employee_uuid: "employee-id" });
  const { biodata, employee_status_uuid, ...rest } = buildTeacherStaffPayload(form);
  const { email, ...updateBiodata } = biodata;
  assert.deepEqual(payload, { uuid: "user-id", employee_uuid: "employee-id", biodata: updateBiodata, ...rest, employee_status: employee_status_uuid });
  assert.equal(Object.hasOwn(payload.biodata, "email"), false);
  assert.equal(Object.hasOwn(payload, "employee_status_uuid"), false);
});

test("update permits nullable optional identifiers but rejects missing required data", () => {
  const input = { ...form, id: "user-id", employee_uuid: "employee-id", email: undefined, nip: "", nuptk: "", title_prefix_uuids: [], title_suffix_uuids: [] };
  const payload = buildTeacherStaffUpdatePayload(input);
  assert.equal(payload.nip, null);
  assert.equal(payload.nuptk, null);
  assert.equal(payload.resign_date, null);
  assert.deepEqual(payload.titles, []);
  assert.throws(() => buildTeacherStaffUpdatePayload({ ...input, employee_uuid: "" }), /UUID/);
  assert.throws(() => buildTeacherStaffUpdatePayload({ ...input, employment_status_uuid: "" }), /status kepegawaian/);
  assert.throws(() => buildTeacherStaffUpdatePayload({ ...input, educations: [] }), /pendidikan/);
  assert.throws(() => buildTeacherStaffUpdatePayload({ ...input, educations: input.educations.map(item => ({ ...item, is_last_education: false })) }), /pendidikan terakhir/);
});


test("resign date is optional and sent as a timestamp for create and update", () => {
  const input = { ...form, uuid: "user-id", employee_uuid: "employee-id", resign_date: "2027-01-15" };
  for (const build of [buildTeacherStaffPayload, buildTeacherStaffUpdatePayload]) {
    assert.equal(build(input).resign_date, "2027-01-15T00:00:00Z");
    assert.equal(build({ ...input, resign_date: "" }).resign_date, null);
    assert.throws(() => build({ ...input, resign_date: "2020-01-01" }), /Tanggal resign tidak boleh/);
  }
});


test("update sends the selected employee type and excludes teacher-only fields for staff", () => {
  const input = { ...form, uuid: "user-id", employee_uuid: "employee-id" };
  const teacher = buildTeacherStaffUpdatePayload({ ...input, role: "teacher" });
  const staff = buildTeacherStaffUpdatePayload({ ...input, role: "staff" });
  assert.equal(teacher.is_staff, false);
  assert.equal(staff.is_staff, true);
  assert.deepEqual(teacher.subjects, [{ uuid: "subject" }]);
  assert.equal(staff.subjects, null);
  assert.equal(staff.nuptk, null);
  assert.equal(staff.employee_uuid, input.employee_uuid);
});
