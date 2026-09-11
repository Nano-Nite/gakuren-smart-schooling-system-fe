export async function resolveStudentClass(form, requestClasses) {
  const name = String(form.class_name || "").trim();
  if (form.class_uuid || !name || name === "-") return form;

  const matches = new Map();
  let maxPage = 1;
  for (let page = 1; page <= maxPage; page += 1) {
    const response = await requestClasses({ search: name, filter: null, page, row_per_page: 100, sort_by: [{ name: "asc" }] });
    const data = response.data || {};
    for (const item of data.result || []) {
      const uuid = item.uuid ?? item.UUID;
      const className = String(item.name ?? item.Name ?? "").trim();
      if (uuid && className.toLowerCase() === name.toLowerCase()) matches.set(uuid, className);
    }
    maxPage = Math.max(1, Number(data.data_statistic?.max_page) || 1);
  }
  if (matches.size !== 1) throw new Error("Kelas siswa belum dapat dipastikan. Pilih kembali kelas dari daftar.");
  const [uuid, className] = matches.entries().next().value;
  return { ...form, class_uuid: uuid, class_name: className };
}
