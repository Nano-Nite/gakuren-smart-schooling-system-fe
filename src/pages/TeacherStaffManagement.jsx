import { useEffect, useState } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp, ChevronLeft, ChevronRight, Download, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import ConfirmDialog from "../components/ConfirmDialog";
import FormDrawer from "../components/FormDrawer";
import Select from "../components/Select";
import StatusBadge from "../components/StatusBadge";
import StatusRowActions from "../components/StatusRowActions";
import API_CONFIG from "../config/api";
import { authenticatedRequest } from "../utils/api";
import { getCrudPermissions } from "../utils/permissions";

const columns = [["Nama", "name"], ["NIP", "nip"], ["Email", "email"], ["No. HP / WhatsApp", "phone"], ["Jabatan", "position"], ["Status", "status"]];
const statuses = { Aktif: "active", Nonaktif: "inactive", Pending: "pending" };
const statusLabels = { active: "Aktif", inactive: "Nonaktif", pending: "Pending" };
const emptyForm = { name: "", nip: "", email: "", phone: "", position: "", status: "Aktif" };
const textFields = [["Nama", "name", "text", "Contoh: Ahmad Fauzi, S.Pd"], ["NIP", "nip", "text", "Masukkan NIP"], ["Email", "email", "email", "Contoh: nama@sekolah.sch.id"], ["No. HP / WhatsApp", "phone", "tel", "Contoh: 081234567890"], ["Jabatan", "position", "text", "Contoh: Guru Matematika"]];

export default function TeacherStaffManagement() {
  const access = getCrudPermissions("teacherandstaff");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [statistics, setStatistics] = useState({ start_row: 0, end_row: 0, total_row: 0, max_page: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [activating, setActivating] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!access.canView) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await authenticatedRequest(API_CONFIG.GET_TEACHER_STAFF, { method: "POST", signal: controller.signal, body: { search: query.trim() || null, filter: status === "Semua" ? null : { status: statuses[status] }, page, row_per_page: pageSize, sort_by: [{ [sort.key]: sort.direction }] } });
        const payload = response.data || {};
        setError("");
        setRows((payload.result || []).map(item => ({ id: item.UUID ?? item.uuid, name: item.Name ?? item.name ?? "-", nip: item.NIP ?? item.Nip ?? item.nip ?? "-", email: item.Email ?? item.email ?? "-", phone: item.Phone ?? item.PhoneNumber ?? item.phone ?? "-", position: item.Position ?? item.Role ?? item.position ?? "-", status: statusLabels[String(item.Status ?? item.status).toLowerCase()] || item.Status || item.status || "-" })));
        setStatistics(payload.data_statistic || { start_row: 0, end_row: 0, total_row: 0, max_page: 1 });
      } catch (requestError) {
        if (requestError.name !== "AbortError") { setRows([]); setError(requestError.message); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 350 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [access.canView, page, pageSize, query, refreshKey, sort, status]);

  const changeSort = key => { setPage(1); setSort(current => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" })); };
  const openDetail = item => { setForm({ ...item }); setSelected(item); setEditing(false); };
  const openEdit = item => { setForm({ ...item }); setSelected(item); setEditing(true); };
  const saveCreate = event => { event.preventDefault(); setRows(current => [{ ...form, id: `local-${Date.now()}` }, ...current]); setStatistics(current => ({ ...current, total_row: current.total_row + 1, end_row: current.end_row + 1 })); setCreating(false); };
  const saveEdit = event => { event.preventDefault(); if (!editing) return; setRows(current => current.map(item => item.id === selected.id ? { ...item, ...form } : item)); setSelected(current => ({ ...current, ...form })); setEditing(false); };
  const confirmDelete = () => { setRows(current => current.filter(item => item.id !== deleting.id)); setStatistics(current => ({ ...current, total_row: Math.max(0, current.total_row - 1), end_row: Math.max(0, current.end_row - 1) })); setDeleting(null); setSelected(null); };
  const confirmActivate = () => { setActivating(null); setRefreshKey(value => value + 1); };

  const formContent = editable => <div className="space-y-5">{textFields.map(([label, key, type, placeholder]) => <label key={key} className="block text-sm"><span className="mb-2 block font-semibold">{label}{editable && <b className="text-rose-500"> *</b>}</span>{editable ? <input required type={type} value={form[key]} placeholder={placeholder} onChange={event => setForm(value => ({ ...value, [key]: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /> : <div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">{form[key] || "-"}</div>}</label>)}{!editable && <div className="text-sm"><span className="mb-2 block font-semibold">Status</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3"><StatusBadge status={form.status} /></div></div>}</div>;

  return <><Helmet><title>Guru dan Staf — Gakuren</title></Helmet><div className="p-4 sm:p-6"><section className="data-table-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
    <div className="flex flex-col gap-3 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between lg:p-4"><div className="flex min-w-0 flex-1 items-center gap-2"><button title="Muat ulang" disabled={loading} onClick={() => setRefreshKey(value => value + 1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><label className="relative min-w-0 flex-1 lg:max-w-56"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Cari data" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500" />{query && <button aria-label="Hapus pencarian" onClick={() => { setQuery(""); setPage(1); }} className="absolute right-1.5 top-1.5 p-2 text-slate-400"><X className="h-4 w-4" /></button>}</label><Select value={status} onChange={value => { setStatus(value); setPage(1); }} ariaLabel="Filter status" className="w-36 shrink-0 sm:w-40" options={[{ value: "Semua", label: "Semua Status" }, "Aktif", "Nonaktif", "Pending"]} /></div><div className="flex w-full justify-end gap-2 md:w-auto">{access.canCreate && <button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"><Download className="h-4 w-4" /><span className="hidden xl:inline">Import</span></button>}<button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"><Upload className="h-4 w-4" /><span className="hidden xl:inline">Export</span></button>{access.canCreate && <button onClick={() => { setForm(emptyForm); setCreating(true); }} className="action-lift inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white md:flex-none"><Plus className="h-4 w-4" />Tambah Guru/Staf</button>}</div></div>
    <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] table-fixed text-left text-xs"><thead className="bg-slate-100/80"><tr>{columns.map(([label, key]) => <th key={key} className="px-3 py-3 font-medium"><button onClick={() => changeSort(key)} className={`group flex items-center gap-1 hover:text-blue-600 ${sort.key === key ? "font-semibold text-blue-600" : ""}`}>{label}{sort.key === key ? sort.direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowDownUp className="h-3 w-3 opacity-0 group-hover:opacity-60" />}</button></th>)}<th className="w-28 px-3 py-3">Aksi</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} tabIndex={0} onClick={() => openDetail(row)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) openDetail(row); }} className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/50 focus:bg-blue-50 focus:outline-none"><td className="px-3 py-3 font-semibold">{row.name}</td><td className="px-3 py-3">{row.nip}</td><td className="truncate px-3 py-3" title={row.email}>{row.email}</td><td className="px-3 py-3">{row.phone}</td><td className="px-3 py-3">{row.position}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td><td className="px-3 py-3"><div className="flex gap-2"><StatusRowActions item={row} label="guru atau staf" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={setDeleting} onActivate={setActivating} /></div></td></tr>)}</tbody></table></div>
    <div className="divide-y divide-slate-100 md:hidden">{rows.map(row => <article key={row.id} onClick={() => openDetail(row)} className="cursor-pointer p-4 text-left hover:bg-blue-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-slate-500">NIP {row.nip} • {row.position}</p><p className="mt-1 truncate text-xs text-slate-500">{row.email}</p><p className="mt-1 text-xs text-slate-500">{row.phone}</p></div><div className="flex w-24 shrink-0 flex-col items-stretch gap-3"><StatusBadge status={row.status} className="w-full" /><div className="grid grid-cols-2 justify-items-center gap-2 [&>button:only-child]:col-span-2"><StatusRowActions item={row} label="guru atau staf" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={setDeleting} onActivate={setActivating} /></div></div></div></article>)}</div>
    {error && <div className="grid place-items-center px-4 py-16 text-center text-rose-600"><p className="font-semibold">Gagal memuat data guru dan staf</p><p className="mt-1 text-xs">{error}</p><button disabled={loading} onClick={() => { setLoading(true); setRefreshKey(value => value + 1); }} className="mt-4 inline-flex min-w-24 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold">{loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}{loading ? "Memuat..." : "Coba lagi"}</button></div>}{loading && !rows.length && !error && <div className="grid place-items-center px-4 py-16"><RefreshCw className="h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-slate-500">Memuat data...</p></div>}{!loading && !error && !rows.length && <div className="grid place-items-center px-4 py-16"><Search className="h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">Tidak ada data ditemukan</p></div>}
    <footer className="grid min-h-[76px] gap-4 border-t border-slate-200 bg-slate-50/50 px-5 py-4 text-xs text-slate-500 sm:grid-cols-3 sm:items-center"><span>Menampilkan <b>{statistics.total_row ? `${statistics.start_row}-${statistics.end_row}` : "0"}</b> dari {statistics.total_row} data</span><div className="flex justify-center gap-1.5"><button disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>{Array.from({ length: Math.min(statistics.max_page || 1, 5) }, (_, index) => index + 1).map(number => <button key={number} onClick={() => setPage(number)} className={`h-9 w-9 rounded-lg font-semibold ${page === number ? "bg-blue-600 text-white" : "border bg-white"}`}>{number}</button>)}<button disabled={page >= (statistics.max_page || 1) || loading} onClick={() => setPage(value => value + 1)} className="grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div><div className="flex justify-end"><Select value={pageSize} onChange={value => { setPageSize(Number(value)); setPage(1); }} ariaLabel="Jumlah data" placement="top" className="w-36" options={[5, 10, 25, 50].map(value => ({ value, label: `${value} / Halaman` }))} /></div></footer>
  </section></div>
  <FormDrawer open={creating} title="Tambah Guru/Staf" submitLabel="Simpan" onClose={() => setCreating(false)} onSubmit={saveCreate}>{formContent(true)}</FormDrawer>
  <FormDrawer open={selected !== null} title={editing ? "Edit Guru/Staf" : "Detail Guru/Staf"} onClose={() => { setSelected(null); setEditing(false); }} onSubmit={saveEdit} footerActions={editing ? <><button type="button" onClick={() => { setForm({ ...selected }); setEditing(false); }} className="rounded-lg border px-5 py-2.5 text-sm">Batal</button><button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Simpan</button></> : <><button type="button" onClick={() => setSelected(null)} className="rounded-lg border px-5 py-2.5 text-sm">Tutup</button>{access.canDelete && <button type="button" disabled={selected?.status === "Pending"} onClick={() => setDeleting(selected)} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-5 py-2.5 text-sm text-rose-600 disabled:opacity-40"><Trash2 className="h-4 w-4" />Hapus</button>}{access.canUpdate && <button type="button" disabled={selected?.status === "Pending"} onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white disabled:opacity-40"><Pencil className="h-4 w-4" />Edit</button>}</>}>{formContent(editing)}</FormDrawer>
  <ConfirmDialog open={activating !== null} title="Aktifkan guru/staf?" description={activating ? `${activating.name} akan diaktifkan.` : ""} confirmLabel="Aktifkan" tone="success" onConfirm={confirmActivate} onCancel={() => setActivating(null)} />
  <ConfirmDialog open={deleting !== null} title="Hapus guru/staf?" description={deleting ? `${deleting.name} akan dihapus.` : ""} confirmLabel="Hapus" onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
  </>;
}
