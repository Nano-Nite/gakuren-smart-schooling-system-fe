import test from "node:test";
import assert from "node:assert/strict";
import { todayAttendanceSession, toLocalInput } from "../src/utils/attendanceSessionDefaults.js";

test("today session defaults to 06:00–14:00 on the same local day regardless of current time", () => {
  for (const now of [new Date(2026, 8, 11, 0, 1), new Date(2026, 8, 11, 9, 30), new Date(2026, 11, 31, 23, 59, 58)]) {
    const session = todayAttendanceSession("school-location", now);
    const start = new Date(session.valid_from);
    const end = new Date(session.valid_until);
    assert.equal(start.toDateString(), now.toDateString());
    assert.equal(start.getHours(), 6);
    assert.equal(start.getMinutes(), 0);
    assert.equal(start.getSeconds(), 0);
    assert.equal(start.getMilliseconds(), 0);
    assert.equal(end.toDateString(), now.toDateString());
    assert.equal(end.getHours(), 14);
    assert.equal(end.getMinutes(), 0);
    assert.equal(end.getSeconds(), 0);
    assert.equal(end.getMilliseconds(), 0);
    assert.ok(end > start);
    assert.equal(session.location_uuid, "school-location");
    assert.equal(session.attendance_type, "CHECK_IN");
    assert.equal(session.target_type, "ALL");
  }
});

test("defaults use the newly supplied day and format custom inputs in local time", () => {
  const before = todayAttendanceSession("", new Date(2026, 8, 11, 23, 59));
  const after = todayAttendanceSession("", new Date(2026, 8, 12, 0, 1));
  assert.equal(toLocalInput(new Date(before.valid_from)), "2026-09-11T06:00");
  assert.equal(toLocalInput(new Date(before.valid_until)), "2026-09-11T14:00");
  assert.equal(toLocalInput(new Date(after.valid_from)), "2026-09-12T06:00");
  assert.equal(toLocalInput(new Date(after.valid_until)), "2026-09-12T14:00");
});
