import test from "node:test";
import assert from "node:assert/strict";
import { hasStudentFormChanges } from "../src/utils/studentFormChanges.js";

const initial = { name: "Siswa", address: "Jalan Sekolah", class_uuid: "", class_name: "VII A", gender_uuid: "", gender: "Laki-laki" };

test("opening edit and resolving existing selections does not mark it dirty", () => {
  assert.equal(hasStudentFormChanges({ ...initial }, initial, false, false), false);
  assert.equal(hasStudentFormChanges({ ...initial, class_uuid: "class-1", gender_uuid: "gender-1", gender: "Laki-Laki" }, initial, false, false), false);
});

test("editing, clearing or changing selections still marks the form dirty", () => {
  for (const change of [{ name: "Nama Baru" }, { class_name: "", class_uuid: "" }, { class_name: "VII B", class_uuid: "class-2" }, { gender: "Perempuan", gender_uuid: "gender-2" }]) {
    assert.equal(hasStudentFormChanges({ ...initial, ...change }, initial, false, false), true);
  }
  const withId = { ...initial, class_uuid: "class-1" };
  assert.equal(hasStudentFormChanges({ ...withId, class_uuid: "class-2" }, withId, false, false), true);
});

test("parent controls are protected when enabled and irrelevant when disabled", () => {
  assert.equal(hasStudentFormChanges(initial, initial, true, false), true);
  assert.equal(hasStudentFormChanges(initial, initial, false, true), false);
  const withParent = { ...initial, parent_name: "Orang Tua", parent_address: initial.address };
  assert.equal(hasStudentFormChanges(withParent, withParent, true, true), false);
  assert.equal(hasStudentFormChanges({ ...withParent, parent_name: "Nama Baru" }, withParent, true, true), true);
  assert.equal(hasStudentFormChanges(withParent, withParent, true, false), true);
});
