const text = value => String(value ?? "");
const label = value => text(value).trim().toLowerCase();

export function hasStudentFormChanges(form, initial, includeParent, sameParentAddress) {
  const initialIncludeParent = Boolean(initial.parent_name || initial.parent_email || initial.parent_phone || initial.parent_address);
  if (includeParent !== initialIncludeParent) return true;
  const fields = ["name", "nis", "nisn", "email", "phone", "address"];
  if (includeParent) {
    fields.push("parent_name", "parent_email", "parent_phone", "parent_address");
    if (sameParentAddress !== Boolean(initial.address && initial.parent_address && initial.address === initial.parent_address)) return true;
  }
  if (fields.some(key => text(form[key]) !== text(initial[key]))) return true;
  return [["class_uuid", "class_name"], ["gender_uuid", "gender"]].some(([idKey, nameKey]) => {
    // Resolving the UUID of an existing named selection is not a user edit.
    if (!initial[idKey] && label(initial[nameKey]) && label(initial[nameKey]) !== "-") {
      return label(form[nameKey]) !== label(initial[nameKey]);
    }
    return text(form[idKey]) !== text(initial[idKey]) || label(form[nameKey]) !== label(initial[nameKey]);
  });
}
