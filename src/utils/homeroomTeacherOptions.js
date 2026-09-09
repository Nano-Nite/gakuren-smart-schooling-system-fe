export function mergeHomeroomTeacherOptions(options, initialTeacher = "") {
  const byUuid = new Map();
  for (const option of options) {
    const key = option.value.trim().toLowerCase();
    if (!key) continue;
    const previous = byUuid.get(key);
    byUuid.set(key, { ...option, value: key, positions: [...new Set([...(previous?.positions || []), ...(option.positions || [])])] });
  }
  const result = [...byUuid.values()];
  const initial = initialTeacher.trim();
  const uuidMatch = byUuid.get(initial.toLowerCase());
  // Legacy class responses contain only a name. Resolve it only when unambiguous.
  const nameMatches = result.filter(option => option.label.trim() === initial);
  const match = uuidMatch || (nameMatches.length === 1 ? nameMatches[0] : null);
  if (initial && !match) result.unshift({ value: initialTeacher, label: initialTeacher, positions: [] });
  return { options: result, initialValue: match?.value ?? initialTeacher };
}
