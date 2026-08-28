import { hasAllPermissions, hasAnyPermission } from "../utils/permissions";

export default function PermissionGate({ permission, anyOf, allOf, fallback = null, children }) {
  let allowed = true;

  if (permission) allowed = hasAllPermissions([permission]);
  if (anyOf) allowed = allowed && hasAnyPermission(anyOf);
  if (allOf) allowed = allowed && hasAllPermissions(allOf);

  return allowed ? children : fallback;
}
