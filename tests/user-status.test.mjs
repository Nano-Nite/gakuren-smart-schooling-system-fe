import test from "node:test";
import assert from "node:assert/strict";
import { isNewUserStatus, isStatusMutationBlocked } from "../src/utils/userStatus.js";

test("new user status aliases block edit and delete", () => {
  for (const status of ["Pengguna Baru", "new_user", "new user", "new-user", " NEW_USER "]) {
    assert.equal(isNewUserStatus(status), true);
    assert.equal(isStatusMutationBlocked(status), true);
  }
});

test("pending remains blocked while existing active and inactive behavior is preserved", () => {
  for (const status of ["Pending", "pending", "Menunggu"]) assert.equal(isStatusMutationBlocked(status), true);
  for (const status of ["Aktif", "active", "Nonaktif", "inactive", null]) assert.equal(isStatusMutationBlocked(status), false);
});
