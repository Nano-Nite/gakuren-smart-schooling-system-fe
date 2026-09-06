import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTeacherStaff, formatTeacherStaffDate } from "../src/utils/teacherStaffData.js";

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
