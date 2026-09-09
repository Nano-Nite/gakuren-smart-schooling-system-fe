import StatusBadge from "./StatusBadge";
import ExpandableBadges from "./ExpandableBadges";
import { useEffect, useState } from "react";
import API_CONFIG from "../config/api";
import { authenticatedRequest } from "../utils/api";
import { formatIndonesianAcademicName } from "../utils/titleOptions";
import { normalizeTeacherStaff } from "../utils/teacherStaffData";

const Field = ({ label, children }) => <div className="min-w-0"><dt className="mb-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-800 dark:text-slate-100 [overflow-wrap:anywhere]">{children ?? "—"}</dd></div>;
const Group = ({ title, children }) => <section className="border-t border-slate-200 py-5 dark:border-white/10"><h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</h4>{children}</section>;

export default function ClassDetail({ data }) {
  const [teacher, setTeacher] = useState(null);
  const [teacherError, setTeacherError] = useState("");
  const [retry, setRetry] = useState(0);
  const assigned = data.homeroom_teacher_uuid || data.homeroom_teacher || data.teacher;
  useEffect(() => {
    const controller = new AbortController();
    setTeacher(null);
    setTeacherError("");
    if (!assigned || assigned === "-") return undefined;
    const load = async () => {
      try {
        let uuid = typeof assigned === "object" ? assigned.uuid : assigned;
        if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(uuid))) {
          const name = typeof assigned === "object" ? assigned.name : assigned;
          const response = await authenticatedRequest(API_CONFIG.GET_TEACHER_STAFF, {
            method: "POST", signal: controller.signal,
            body: { search: name, filter: null, page: 1, row_per_page: 100 },
          });
          const matches = (response.data?.result || []).filter(item => (item.name ?? item.full_name ?? item.biodata?.full_name)?.trim() === String(name).trim());
          if (matches.length !== 1 || response.data?.data_statistic?.max_page > 1) throw new Error("Nama dan gelar belum dapat dipastikan. Data kelas perlu menyertakan UUID wali kelas.");
          uuid = matches[0].uuid;
        }
        if (!uuid) throw new Error("Data wali kelas tidak ditemukan.");
        const response = await authenticatedRequest(`${API_CONFIG.GET_TEACHER_STAFF}?uuid=${encodeURIComponent(uuid)}`, { method: "GET", signal: controller.signal });
        if (!response.data?.uuid) throw new Error("Data wali kelas tidak ditemukan.");
        const detail = normalizeTeacherStaff(response.data);
        const name = detail.name || detail.full_name || detail.biodata?.full_name;
        if (!name) throw new Error("Nama wali kelas tidak tersedia.");
        const rawPositions = response.data.positions ?? response.data.position ?? [];
        const positions = [...new Set((Array.isArray(rawPositions) ? rawPositions : [rawPositions])
          .map(position => typeof position === "string" ? position : position?.name)
          .filter(position => typeof position === "string" && position.trim())
          .map(position => position.trim()))];
        if (!controller.signal.aborted) setTeacher({
          name: formatIndonesianAcademicName(name, detail.title_prefixes, detail.title_suffixes),
          positions,
        });
      } catch (error) {
        if (!controller.signal.aborted) setTeacherError(error.message || "Gagal memuat nama dan gelar wali kelas.");
      }
    };
    load();
    return () => controller.abort();
  }, [assigned, retry]);
  return <div className="min-w-0">
    <header className="mb-6">
      <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Informasi kelas</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">Identitas kelas dan penugasan wali kelas.</p>
    </header>
    <div className="pb-5">
      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Nama kelas</p>
      <p className="break-words text-2xl font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-100">{data.name || "—"}</p>
    </div>
    <Group title="Identitas">
      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field label="Singkatan kelas">{data.abbr_name || "—"}</Field>
        <Field label="Tingkat">{data.level}</Field>
        <Field label="Jumlah siswa">{data.students ?? 0}</Field>
        <Field label="Status kelas"><StatusBadge status={data.status} /></Field>
      </dl>
    </Group>
    <Group title="Penugasan">
      <dl className="grid gap-5"><Field label="Wali kelas">{!assigned || assigned === "-" ? "Belum ditentukan" : teacherError ? <span role="alert" className="block text-rose-600"><span className="block text-xs">{teacherError}</span><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-1 text-xs font-semibold underline">Coba lagi</button></span> : teacher ? <span className="block"><span className="block break-words text-lg font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-100">{teacher.name}</span>{teacher.positions.length > 0 && <span className="mt-1.5 block"><ExpandableBadges key={String(assigned)} items={teacher.positions} /></span>}</span> : <span role="status" className="text-slate-500">Memuat nama dan gelar...</span>}</Field></dl>
    </Group>
  </div>;
}
