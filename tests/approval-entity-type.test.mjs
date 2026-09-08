import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isTeacherStaffEntity } from "../src/utils/approvalEntityType.js";

test("teacher and staff aliases share the approval layout", () => {
  for (const type of ["tns", "TNS", "teacher", "staff", "staf", "guru", "teacher_and_staff", "school_tns"]) {
    assert.equal(isTeacherStaffEntity(type), true, type);
  }
  for (const type of ["student", "class", "", null]) assert.equal(isTeacherStaffEntity(type), false);
});

test("approval schema uses entity type independently of optional NIP", async () => {
  const source = await readFile("src/pages/ApprovalManagement.jsx", "utf8");
  const start = source.indexOf("function getApprovalFieldSchema(");
  const end = source.indexOf("\nfunction getApprovalRequestEntries", start);
  const schemas = { teacher: "teacher", student: "student", class: "class" };
  const schema = new Function("isTeacherStaffEntity", "approvalFieldSchemas", "normalizeApprovalFieldKey", `return (${source.slice(start, end)});`)(isTeacherStaffEntity, schemas, key => String(key).replace(/[^a-z0-9]/gi, "").toLowerCase());
  for (const type of ["tns", "teacher", "staff"]) {
    for (const data of [{}, { nip: null }, { nip: "123" }]) assert.equal(schema(type, data), "teacher");
  }
  assert.deepEqual(schema("unknown", { nip: "123" }), []);
  assert.equal(schema("student", { nip: "123" }), "student");
});
