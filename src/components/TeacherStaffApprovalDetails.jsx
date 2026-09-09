import { useEffect, useState } from "react";
import { getDailyReference } from "../utils/dailyReferenceCache";
import { approvalReferenceId, resolveApprovalReference } from "../utils/resolveApprovalReference";
import { formatTeacherStaffDate } from "../utils/teacherStaffData";

const groups = [
  ["Biodata", "Informasi pribadi dan kontak", [
    ["full_name", "Nama lengkap", "name"], ["email", "Email"], ["phone", "Nomor HP dan WhatsApp"],
    ["gender_uuid", "Jenis kelamin", "gender", "gender"], ["birth_place", "Tempat lahir"],
    ["birth_date", "Tanggal lahir"], ["address", "Alamat"], ["titles", "Gelar akademik", "titles", "title"],
  ]],
  ["Pendidikan", "Riwayat institusi dan jenjang pendidikan", [["education_level", "Riwayat pendidikan", "educations", "education"]]],
  ["Pekerjaan", "Identitas kepegawaian dan penugasan", [
    ["is_staff", "Jenis pegawai", "occupation"], ["nik", "NIK"], ["nuptk", "NUPTK"], ["nip", "NIP"],
    ["positions", "Jabatan", "positions", "position"], ["subjects", "Mata pelajaran", "subject", "subject"],
    ["employee_status_uuid", "Status kepegawaian", "employee_status", "employeeStatus"],
    ["join_date", "Tanggal bergabung"], ["resign_date", "Tanggal keluar"],
  ]],
];
const read = (data, key, alias = key) => {
  for (const source of [data?.biodata, data]) {
    if (source && Object.hasOwn(source, key)) return source[key];
    if (source && Object.hasOwn(source, alias)) return source[alias];
  }
  return undefined;
};
const asList = value => Array.isArray(value) ? value : value ? [value] : [];

export default function TeacherStaffApprovalDetails({ requestData, activeData, isUpdate }) {
  const [references, setReferences] = useState({});
  const [referenceError, setReferenceError] = useState(false);
  const [referenceStates, setReferenceStates] = useState({});
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setReferenceError(false);
    setReferences({});
    setReferenceStates({});
    const isStaff = requestData.is_staff ?? /^(staff|staf)$/i.test(activeData?.occupation || "");
    const types = ["gender", "title", "education", "position", "subject", "employeeStatus"];
    Promise.allSettled(types.map(async type => {
      const requiredIds = [...new Set(groups.flatMap(([, , fields]) => fields.filter(([, , , referenceType]) => referenceType === type).flatMap(([key, , alias]) => [requestData, activeData].flatMap(data => asList(read(data, key, alias)).map(approvalReferenceId)))).filter(Boolean))];
      const response = await resolveApprovalReference(getDailyReference, type, { signal: controller.signal, forceRefresh: retry > 0, ...(["position", "employeeStatus"].includes(type) ? { isStaff } : {}) }, requiredIds);
      return [type, response];
    })).then(results => {
      if (controller.signal.aborted) return;
      const completed = results.filter(result => result.status === "fulfilled").map(result => result.value);
      setReferences(Object.fromEntries(completed.map(([type, response]) => [type, response.result])));
      setReferenceStates(Object.fromEntries(completed.map(([type, response]) => [type, response.failed ? "failed" : "ready"])));
      setReferenceError(results.some(result => result.status === "rejected") || completed.some(([, response]) => response.failed));
    });
    return () => controller.abort();
  }, [requestData, activeData, retry]);

  const referenceLabel = (value, type) => {
    const uuid = typeof value === "object" ? value?.education_level_uuid ?? value?.uuid : value;
    const option = references[type]?.find(item => item.uuid === uuid);
    const displayName = item => ["gender", "employeeStatus", "position"].includes(type)
      ? item?.name || item?.abbr_name || item?.code
      : item?.abbr_name || item?.code || item?.name;
    const label = displayName(option) || (typeof value === "object" ? displayName(value) : !approvalReferenceId(value) ? String(value) : "");
    if (label) return label;
    if (!referenceStates[type]) return "Memuat nama referensi...";
    return referenceStates[type] === "failed" ? "Gagal memuat nama" : "Nama tidak tersedia di referensi";
  };
  const display = (value, key, type) => {
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) return <span className="font-normal text-slate-400">Belum diisi</span>;
    if (key === "education_level") return <div className="space-y-3">{asList(value).map((education, index) => <article key={index} className="border-l-2 border-slate-200 pl-3 dark:border-white/15">
      <div className="mb-1 flex flex-wrap items-center gap-2"><span className="text-xs text-slate-500">Pendidikan {index + 1}</span>{(education.last_education ?? education.is_latest ?? education.is_last_education) && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">Pendidikan terakhir</span>}</div>
      <p className="font-semibold">{education.institution_name || education.institution || "Institusi belum diisi"}</p>
      <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">{[["Jenjang", referenceLabel(education, "education")], ["Jurusan", education.major || "Belum diisi"], ["Tahun masuk", education.start_year ?? education.enrollment_year ?? "Belum diisi"], ["Tahun lulus", education.end_year ?? education.graduation_year ?? "Belum diisi"]].map(([label, text]) => <div key={label}><dt className="inline font-normal text-slate-500">{label}: </dt><dd className="inline">{text}</dd></div>)}</dl>
    </article>)}</div>;
    if (key.endsWith("_date")) return formatTeacherStaffDate(value);
    if (key === "is_staff") return typeof value === "boolean" ? value ? "Staf" : "Guru" : String(value);
    if (type === "position" || type === "subject") return <ul className="flex flex-wrap gap-1.5">{asList(value).map((item, index) => <li key={index} className="max-w-full rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold leading-5 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200 [overflow-wrap:anywhere]">{referenceLabel(item, type)}</li>)}</ul>;
    if (type) return <ul className="flex flex-wrap gap-x-3 gap-y-1">{asList(value).map((item, index) => <li key={index} className="text-sm">{referenceLabel(item, type)}</li>)}</ul>;
    return String(value);
  };
  const comparable = (value, key, type) => {
    if (value === undefined || value === null || value === "") return "";
    if (key.endsWith("_date")) return String(value).slice(0, 10);
    if (key === "is_staff") return typeof value === "boolean" ? value ? "staff" : "teacher" : /^(staff|staf)$/i.test(value) ? "staff" : "teacher";
    if (type && key !== "education_level") return asList(value).map(item => { const label = referenceLabel(item, type); return ["Memuat nama referensi...", "Gagal memuat nama", "Nama tidak tersedia di referensi"].includes(label) ? JSON.stringify(item) : label; }).sort().join("|");
    if (key === "education_level") return JSON.stringify(asList(value).map(item => [item.institution_name ?? item.institution ?? "", referenceLabel(item, "education"), item.major ?? "", String(item.start_year ?? item.enrollment_year ?? ""), String(item.end_year ?? item.graduation_year ?? ""), Boolean(item.last_education ?? item.is_latest ?? item.is_last_education)]));
    return String(value).trim();
  };
  const compare = Boolean(isUpdate && activeData);
  const rows = groups.flatMap(([group, , fields]) => fields
    .filter(([key, , alias]) => read(requestData, key, alias) !== undefined)
    .map(([key, label, alias, type]) => {
      const value = read(requestData, key, alias);
      const current = read(activeData, key, alias);
      return { group, key, label, type, value, current, changed: compare && comparable(current, key, type) !== comparable(value, key, type) };
    }));
  const changedRows = rows.filter(row => row.changed);
  const unchangedRows = rows.filter(row => !row.changed);
  const renderRows = items => <dl className="divide-y divide-slate-100 dark:divide-white/10">{items.map((row, index) => <div key={row.key} className="py-3">
    {items[index - 1]?.group !== row.group && <dt className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{row.group}</dt>}
    <dt className="mb-1 text-xs text-slate-500">{row.label}{row.changed && <span className="sr-only"> — Berubah</span>}</dt>
    <dd className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800 dark:text-slate-100">
      {row.changed ? <div className="space-y-2">
        <div className="min-w-0 text-slate-500 dark:text-slate-400"><span className="mb-0.5 block text-[11px]">Saat ini</span>{display(row.current, row.key, row.type)}</div>
        <div className="min-w-0 font-medium text-orange-700 dark:text-orange-300"><span className="mb-0.5 block text-[11px] font-normal"><span aria-hidden="true">→ </span>Diajukan</span>{display(row.value, row.key, row.type)}</div>
      </div> : display(row.value, row.key, row.type)}
    </dd>
  </div>)}</dl>;
  return <div>
    {referenceError && <div role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Sebagian nama referensi belum dapat dimuat. <button type="button" onClick={() => setRetry(value => value + 1)} className="font-semibold underline">Coba lagi</button></div>}
    {compare ? <>
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{changedRows.length ? `${changedRows.length} data berubah` : "Tidak ada perubahan data terdeteksi"}</p>
      {renderRows(changedRows)}
      {unchangedRows.length > 0 && <details className="mt-3 border-t border-slate-200 pt-3 dark:border-white/15">
        <summary className="cursor-pointer rounded py-2 text-sm font-medium text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Data lainnya ({unchangedRows.length} tidak berubah)</summary>
        {renderRows(unchangedRows)}
      </details>}
    </> : rows.length ? renderRows(rows) : <p className="text-sm text-slate-500">Tidak ada data permintaan.</p>}
  </div>;
}
