export async function resolveStudentGender(form, fetchReference) {
  if (form.gender_uuid) return form;
  const normalize = value => String(value ?? "").trim().toLowerCase();
  const name = normalize(form.gender_name);
  if (!name) throw new Error("Jenis kelamin siswa belum tersedia. Lengkapi data siswa sebelum mengaktifkan.");
  const { result } = await fetchReference("gender");
  const matches = new Set(result.filter(item => normalize(item.name ?? item.Name) === name)
    .map(item => item.uuid ?? item.UUID).filter(uuid => typeof uuid === "string" && uuid.trim()));
  if (matches.size !== 1) throw new Error("Jenis kelamin siswa belum dapat dipastikan dari referensi. Periksa data jenis kelamin lalu coba lagi.");
  return { ...form, gender_uuid: [...matches][0] };
}
