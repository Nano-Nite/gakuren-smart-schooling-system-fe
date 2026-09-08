const styles = {
  Aktif: "bg-emerald-100 text-emerald-600",
  Nonaktif: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  Pending: "bg-amber-100 text-amber-700",
};

export default function StatusBadge({ status, className = "" }) {
  return <span className={`inline-flex min-w-28 items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"} ${className}`}>{status === "Pending" ? "Menunggu" : status || "-"}</span>;
}
