import { BadgeCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { getCrudPermissions, getPermissions } from "../utils/permissions";
import DataTable from "../components/DataTable";
import AttendanceStats from "../components/AttendanceStats";

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
    <Helmet><title>Beranda — Gakuren</title></Helmet>
    <div className="mx-auto max-w-[1680px] space-y-4 p-4 sm:p-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="font-bold">Ringkasan Hari Ini</h2><p className="mt-1 text-xs text-slate-500">Kehadiran real-time</p></div>
          <span className="text-[10px] text-slate-400">Update 07:00 WIB</span>
        </div>
        <AttendanceStats horizontal />
      </section>
      <DataTable data={records} columns={columns} title="Daftar Hadir Terbaru" headerAction={attendance.canView && <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50">Lihat Semua</button>} renderMobileRow={row => <article className="p-4"><div className="flex justify-between"><p className="font-semibold">{row.name}</p><span className="text-xs font-medium text-emerald-600">Hadir</span></div><p className="mt-1 text-xs text-slate-500">{row.location} • {row.time}</p><p className="mt-2 flex items-center gap-1 text-xs">Trust {row.score}<BadgeCheck className="h-4 w-4 text-emerald-500" /></p></article>} />
    </div>
  </>;
}
