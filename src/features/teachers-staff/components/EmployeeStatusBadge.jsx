import { formatTeacherStaffStatus } from "../utils/teacherStaffData";

const employeeStatusColors = {
  aktif: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  tetap: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  kontrak: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  honorer: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  outsourcing: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  gty: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  gtt: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  pns: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  pppk: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  nonaktif: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

export default function EmployeeStatusBadge({ status, className = "" }) {
  const label = formatTeacherStaffStatus(status);
  const color = employeeStatusColors[String(label).trim().toLowerCase()] || (label === "-" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300");
  return <span className={`inline-flex w-28 max-w-full items-center justify-center rounded-full px-3 py-1 text-center text-xs font-medium break-words ${color} ${className}`}>{label}</span>;
}
