import test from "node:test";
import { buildTeacherStaffUpdatePayload } from "../src/utils/teacherStaffPayload.js";
import assert from "node:assert/strict";
import { normalizeTeacherStaff, formatTeacherStaffDate, buildTeacherStaffEditForm } from "../src/utils/teacherStaffData.js";

test("table maps occupation and preserves backend statuses", () => {
  const row = normalizeTeacherStaff({ uuid: "staff-id", occupation: "Staff", status: "New User" });
  assert.equal(row.id, "staff-id");
  assert.equal(row.position, "Staff");
  assert.equal(row.status, "Pengguna Baru");
  assert.equal(normalizeTeacherStaff({ status: "pending" }).status, "Pending");
});

test("detail retains education years and sorts academic titles without mutating input", () => {
  const titles = [{ sequence: 3, abbr_name: "Gr.", is_prefix: false }, { sequence: 2, abbr_name: "S.Kom", is_prefix: false }, { sequence: 1, abbr_name: "Dr.", is_prefix: true }];
  const detail = normalizeTeacherStaff({ uuid: "teacher-id", titles, positions: ["Guru", "Kepala Laboratorium"], educations: [{ start_year: 2013, end_year: 2017 }] });
  assert.equal(detail.position, "Guru, Kepala Laboratorium");
  assert.deepEqual(detail.title_prefixes, ["Dr."]);
  assert.deepEqual(detail.title_suffixes, ["S.Kom", "Gr."]);
  assert.equal(titles[0].sequence, 3);
  assert.equal(detail.educations[0].start_year, 2013);
  assert.equal(detail.educations[0].end_year, 2017);
});

test("account status uses status_user independently of employee_status", () => {
  const row = normalizeTeacherStaff({ status_user: "inactive", employee_status: "Tetap", status: "active" });
  assert.equal(row.status, "Nonaktif");
  assert.equal(row.status_user, "inactive");
  assert.equal(row.employee_status, "Tetap");
  const employeeOnly = normalizeTeacherStaff({ employee_status: "Kontrak" });
  assert.equal(employeeOnly.status, "-");
  assert.equal(employeeOnly.employee_status, "Kontrak");
});

test("calendar dates show Indonesian dates without time or timezone shifts", () => {
  assert.equal(formatTeacherStaffDate("1995-08-20T00:00:00Z"), "20 Agustus 1995");
  assert.equal(formatTeacherStaffDate("2026-12-06T00:00:00Z"), "6 Desember 2026");
  assert.equal(formatTeacherStaffDate(null), "-");
  assert.equal(formatTeacherStaffDate("invalid"), "-");
});

test("edit form maps detail fields and resolves reference labels without changing source", () => {
  const source = {
    occupation: "Staff", gender: "Perempuan", employee_status: "Tetap",
    positions: ["Administrasi"], titles: [{ abbr_name: "S.Kom", is_prefix: false }],
    birth_date: "1995-08-20T00:00:00Z",
    educations: [{ institution_name: "Universitas", code: "S1", start_year: 2013, end_year: 2017, is_latest: true }],
  };
  const form = buildTeacherStaffEditForm(source, {
    gender: [{ uuid: "gender-id", name: "Perempuan" }],
    employeeStatus: [{ uuid: "status-id", name: "Tetap" }],
    position: [{ uuid: "position-id", name: "Administrasi" }],
    title: [{ uuid: "title-id", abbr_name: "S.Kom" }],
    education: [{ uuid: "level-id", code: "S1", level_order: 3 }],
  });
  assert.equal(form.role, "staff");
  assert.equal(form.gender_uuid, "gender-id");
  assert.equal(form.employment_status_uuid, "status-id");
  assert.deepEqual(form.position_uuids, ["position-id"]);
  assert.deepEqual(form.title_suffix_uuids, ["title-id"]);
  assert.equal(form.birth_date, "1995-08-20");
  assert.equal(form.educations[0].institution, "Universitas");
  assert.equal(form.educations[0].enrollment_year, "2013");
  assert.equal(form.educations[0].graduation_year, "2017");
  assert.equal(form.educations[0].education_level_uuid, "level-id");
  assert.equal(form.educations[0].education_level_order, 3);
  assert.equal(form.educations[0].is_last_education, true);
  assert.equal(source.educations[0].institution, undefined);
});

test("edit form preserves explicit UUIDs and does not guess ambiguous reference labels", () => {
  const form = buildTeacherStaffEditForm({ gender_uuid: "existing", positions: ["Guru"], subject: [{ uuid: "subject-id", name: "Matematika" }], educations: null }, {
    position: [{ uuid: "one", name: "Guru" }, { uuid: "two", name: "Guru" }],
  });
  assert.equal(form.gender_uuid, "existing");
  assert.deepEqual(form.position_uuids, []);
  assert.deepEqual(form.subject_uuids, ["subject-id"]);
  assert.deepEqual(form.educations, []);
});

test("updated staff detail preserves separate user and employee UUIDs through update payload", () => {
  const response = {
    uuid: "74dfd7f7-16a4-4d5c-ba05-a1047b90cbab",
    employee_uuid: "7b1b4f56-5f94-4439-80d9-dd19af5c28fe",
    name: "test staff", email: "teststaff1@yopmail.com", phone: "081212121214",
    gender: "Laki-Laki", birth_place: "test staff birth place", birth_date: "1995-08-20T00:00:00Z",
    address: "test staff address", nik: "3210000000000002", nip: "198609262015051002",
    join_date: "2026-12-06T00:00:00Z", status_user: "New User", employee_status: "Honorer",
    educations: [
      { code: "S1", major: "Teknik Informatika", end_year: 2017, is_latest: true, start_year: 2013, institution_name: "Universitas Singaperbangsa Karawang" },
      { code: "SMA", major: "MIPA", end_year: 2013, is_latest: false, start_year: 2010, institution_name: "High School A" },
      { code: "SMP", major: "", end_year: 2010, is_latest: false, start_year: 2007, institution_name: "Mid School A" },
      { code: "SD", major: "", end_year: 2007, is_latest: false, start_year: 2001, institution_name: "Elementary School A" },
    ],
    positions: ["Staf Tata Usaha", "Operator Sekolah"],
  };
  // The page retains occupation from the table when detail omits it.
  const detail = normalizeTeacherStaff({ ...response, occupation: "Staff" });
  const form = buildTeacherStaffEditForm(detail, {
    gender: [{ uuid: "gender-id", name: "Laki-Laki" }],
    employeeStatus: [{ uuid: "status-id", name: "Honorer" }],
    position: response.positions.map((name, index) => ({ uuid: `position-${index}`, name })),
    education: response.educations.map((item, index) => ({ uuid: `education-${index}`, code: item.code, level_order: 4 - index })),
  });
  const payload = buildTeacherStaffUpdatePayload(form);
  assert.equal(payload.uuid, response.uuid);
  assert.equal(payload.employee_uuid, response.employee_uuid);
  assert.equal(payload.is_staff, true);
  assert.equal(payload.employee_status, "status-id");
  assert.equal(payload.biodata.gender_uuid, "gender-id");
  assert.equal(payload.biodata.birth_date, response.birth_date);
  assert.equal(payload.join_date, response.join_date);
  assert.equal(payload.education_level.length, 4);
  assert.equal(payload.education_level[0].last_education, true);
  assert.equal(payload.education_level[3].start_year, 2001);
  assert.equal(payload.positions.length, 2);
  assert.deepEqual(payload.titles, []);
  assert.equal(payload.subjects, null);
  assert.equal(payload.nuptk, null);
  assert.equal(Object.hasOwn(payload.biodata, "email"), false);
});
