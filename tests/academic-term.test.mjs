import test from "node:test";
import assert from "node:assert/strict";
import { getAutomaticAcademicTerm, isValidAcademicTerm, readAcademicTermOverride } from "../src/utils/academicTerm.js";

test("academic term changes at January and July boundaries", () => {
  for (const [date, startYear, semester] of [
    [new Date(2026, 5, 30, 23, 59), 2025, "Genap"],
    [new Date(2026, 6, 1), 2026, "Ganjil"],
    [new Date(2026, 11, 31, 23, 59), 2026, "Ganjil"],
    [new Date(2027, 0, 1), 2026, "Genap"],
  ]) assert.deepEqual(getAutomaticAcademicTerm(date), { startYear, semester });
});

test("manual preferences restore only valid terms and use the supplied scope", () => {
  const value = { startYear: 2024, semester: "Genap" };
  const storage = { getItem: key => key === "school-user" ? JSON.stringify(value) : null };
  assert.deepEqual(readAcademicTermOverride(storage, "school-user"), value);
  assert.equal(readAcademicTermOverride(storage, "other-school"), null);
  for (const invalid of [null, {}, { startYear: 0, semester: "Ganjil" }, { startYear: 2026.5, semester: "Genap" }, { startYear: 2026, semester: "invalid" }]) assert.equal(isValidAcademicTerm(invalid), false);
  assert.equal(readAcademicTermOverride({ getItem: () => "broken" }, "key"), null);
  assert.equal(readAcademicTermOverride({ getItem: () => { throw new Error("Unavailable"); } }, "key"), null);
});
