import { TOKEN_KEYS } from "../config/api";

export const cacheScopeFor = (tenant, school, user) => {
  const owner = user?.uuid || user?.user_uuid || user?.UserUUID || user?.id;
  return owner && tenant && school
    ? [tenant, school, owner].map(value => encodeURIComponent(String(value))).join(":")
    : null;
};

// Storage identifiers partition cached data; they are never proof of authorization.
export const getCacheScope = () => {
  let user;
  try { user = JSON.parse(sessionStorage.getItem(TOKEN_KEYS.USER_DATA) || "null"); }
  catch { return null; }
  const tenant = sessionStorage.getItem(TOKEN_KEYS.TENANT_ID);
  const school = sessionStorage.getItem(TOKEN_KEYS.SCHOOL_UUID);
  return cacheScopeFor(tenant, school, user);
};
