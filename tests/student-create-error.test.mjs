import test from "node:test";
import assert from "node:assert/strict";
import { getStudentCreateErrorMessage } from "../src/utils/studentCreateError.js";

test("student creation prioritizes the duplicate account reason over the generic backend message", () => {
  const error = Object.assign(new Error("Fail to check user"), { serverError: "Multiple user found" });
  const message = getStudentCreateErrorMessage(error);
  assert.match(message, /lebih dari satu akun pengguna/);
  assert.match(message, /administrator sekolah/);
  assert.doesNotMatch(message, /Fail to check user|Multiple user found/);
});

test("user check failures are localized without incorrectly claiming duplicate accounts", () => {
  const message = getStudentCreateErrorMessage(new Error("Fail to check user"));
  assert.match(message, /pemeriksaan akun pengguna gagal/);
  assert.doesNotMatch(message, /duplikat/);
});

test("other errors retain their existing messages and missing messages have a fallback", () => {
  assert.equal(getStudentCreateErrorMessage(new Error("Koneksi terputus.")), "Koneksi terputus.");
  assert.match(getStudentCreateErrorMessage(null), /Siswa gagal ditambahkan/);
});
