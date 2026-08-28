import { BadgeCheck, GraduationCap, Timer, Users } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { getCrudPermissions, getPermissions } from "../utils/permissions";
import DataTable from "../components/DataTable";

const stats = [
  ["Kehadiran Guru", "18", "21", GraduationCap, "bg-blue-50 text-blue-600"],
  ["Kehadiran Siswa", "421", "433", Users, "bg-emerald-50 text-emerald-500"],
  ["Keterlambatan Hari Ini", "7", null, Timer, "bg-orange-50 text-orange-500"],
];
const records = Array.from({ length: 10 }, (_, id) => ({ id, name: "Nama Murid", role: "Murid", time: "06:30", location: "Gerbang Utama", score: "98%" }));

export default function Dashboard() {
  const attendance = getCrudPermissions("attendance", getPermissions());
  const columns = [
    { key: "name", label: "Nama", width: "w-[20%]", cellClass: "font-medium text-slate-900" },
    { key: "role", label: "Peran", width: "w-[14%]", render: row => <span className="text-purple-600">{row.role}</span> },
    { key: "time", label: "Waktu", width: "w-[12%]" },
    { key: "status", label: "Status", width: "w-[12%]", render: () => <span className="font-medium text-emerald-600">Hadir</span> },
    { key: "location", label: "Lokasi", width: "w-[24%]", hideAt: "hidden lg:table-cell" },
    { key: "score", label: "Trust Score", width: "w-[18%]", render: row => <span className="flex items-center gap-1">{row.score}<BadgeCheck className="h-4 w-4 text-emerald-500" /></span> },
  ];
  return <>
    <Helmet><title>Dashboard — Gakuren</title></Helmet>
    <div className="mx-auto max-w-[1680px] space-y-4 p-4 sm:p-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([title, value, total, Icon, tone]) => <article key={title} className="flex min-h-[104px] items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card"><div className={`grid h-14 w-14 place-items-center rounded-xl ${tone}`}><Icon className="h-7 w-7" /></div><div><p className="text-sm text-slate-500">{title}</p><p className="mt-1 text-2xl font-bold">{value} {total && <span className="text-lg font-normal text-slate-400">/ {total}</span>}</p></div></article>)}</section>
      <DataTable data={records} columns={columns} title="Daftar Hadir Terbaru" headerAction={attendance.canView && <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50">Lihat Semua</button>} renderMobileRow={row => <article className="p-4"><div className="flex justify-between"><p className="font-semibold">{row.name}</p><span className="text-xs font-medium text-emerald-600">Hadir</span></div><p className="mt-1 text-xs text-slate-500">{row.location} • {row.time}</p><p className="mt-2 flex items-center gap-1 text-xs">Trust {row.score}<BadgeCheck className="h-4 w-4 text-emerald-500" /></p></article>} />
    </div>
  </>;
}
