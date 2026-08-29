import { useEffect, useState } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp, CheckCircle2, ChevronLeft, ChevronRight, Download, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Select from "../components/Select";
import FormDrawer from "../components/FormDrawer";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBadge from "../components/StatusBadge";
import StatusRowActions from "../components/StatusRowActions";
import API_CONFIG from "../config/api";
import { authenticatedRequest } from "../utils/api";
import { getCrudPermissions } from "../utils/permissions";

const columns = [
  ["Nama", "name"],
  ["NIS", "nis"],
  ["Kelas", "class_name"],
  ["No. HP / WhatsApp", "phone"],
  ["Jenis Kelamin", "gender"],
  ["Status", "status"],
];
const statusApiValues = { Aktif: "active", Nonaktif: "inactive", Pending: "pending" };
const statusLabels = { active: "Aktif", inactive: "Nonaktif", pending: "Pending" };
const emptyForm = { name: "", nis: "", class_name: "", phone: "", gender: "Laki-Laki", status: "Aktif" };

export default function StudentManagement() {
  const access = getCrudPermissions("student");
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
        const response = await authenticatedRequest(API_CONFIG.GET_STUDENTS, {
          method: "POST",
          signal: controller.signal,
          body: {
            search: query.trim() || null,
            filter: status === "Semua" ? null : { status: statusApiValues[status] },
            page,
            row_per_page: pageSize,
            sort_by: [{ [sort.key]: sort.direction }],
          },
        });
        const payload = response.data || {};
        setError("");
        setRows((payload.result || []).map(student => ({
          id: student.UUID ?? student.uuid,
          name: student.Name ?? student.name ?? "-",
          nis: student.NIS ?? student.Nis ?? student.nis ?? "-",
          class_name: student.ClassName ?? student.Class ?? student.class_name ?? "-",
          phone: student.Phone ?? student.PhoneNumber ?? student.phone ?? "-",
          gender: student.Gender ?? student.gender ?? "-",
          status: statusLabels[String(student.Status ?? student.status).toLowerCase()] || student.Status || student.status || "-",
        })));
        setStatistics(payload.data_statistic || { start_row: 0, end_row: 0, total_row: 0, max_page: 1 });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setRows([]);
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 350 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [access.canView, page, pageSize, query, refreshKey, sort, status]);

  const changeSort = key => {
    setPage(1);
    setSort(current => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  };
  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };
  const saveStudent = event => {
    event.preventDefault();
    setRows(current => [{ ...form, id: `local-${Date.now()}` }, ...current]);
    setStatistics(current => ({ ...current, total_row: current.total_row + 1, end_row: current.end_row + 1 }));
    setCreating(false);
  };
  const openDetail = student => {
    setForm({ ...student });
    setSelected(student);
    setEditing(false);
  };
  const openEdit = student => {
    setForm({ ...student });
    setSelected(student);
    setEditing(true);
  };
  const saveEdit = event => {
    event.preventDefault();
    if (!editing) return;
    setRows(current => current.map(student => student.id === selected.id ? { ...student, ...form } : student));
    setSelected(current => ({ ...current, ...form }));
    setEditing(false);
  };
  const confirmDelete = () => {
    setRows(current => current.filter(student => student.id !== deleting.id));
    setStatistics(current => ({ ...current, total_row: Math.max(0, current.total_row - 1), end_row: Math.max(0, current.end_row - 1) }));
    setDeleting(null);
    setSelected(null);
  };
  const confirmActivate = () => {
    setActivating(null);
    setRefreshKey(value => value + 1);
  };

  return <>
    <Helmet><title>Siswa — Gakuren</title></Helmet>
    <div className="p-4 sm:p-6">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between lg:p-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
            <button title="Muat ulang" disabled={loading} onClick={() => setRefreshKey(value => value + 1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
            <label className="relative min-w-0 flex-1 lg:max-w-56"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Cari data" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />{query && <button aria-label="Hapus pencarian" onClick={() => { setQuery(""); setPage(1); }} className="absolute right-1.5 top-1.5 rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</label>
            <Select value={status} onChange={value => { setStatus(value); setPage(1); }} ariaLabel="Filter status" className="w-36 shrink-0 sm:w-40" options={[{ value: "Semua", label: "Semua Status" }, "Aktif", "Nonaktif", "Pending"]} />
          </div>
          <div className="flex w-full justify-end gap-2 md:w-auto">
            {access.canCreate && <button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 shadow-sm"><Download className="h-4 w-4" /><span className="hidden xl:inline">Import</span></button>}
            <button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 shadow-sm"><Upload className="h-4 w-4" /><span className="hidden xl:inline">Export</span></button>
            {access.canCreate && <button onClick={openCreate} className="action-lift inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 md:flex-none"><Plus className="h-4 w-4" />Tambah Siswa</button>}
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] table-fixed text-left text-xs">
            <thead className="bg-slate-100/80"><tr>{columns.map(([label, key]) => <th key={key} className="px-3 py-3 font-medium"><button onClick={() => changeSort(key)} className={`group flex items-center gap-1 hover:text-blue-600 ${sort.key === key ? "font-semibold text-blue-600" : ""}`}><span>{label}</span>{sort.key === key ? sort.direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowDownUp className="h-3 w-3 opacity-0 group-hover:opacity-60" />}</button></th>)}<th className="w-28 px-3 py-3 font-medium">Aksi</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id} tabIndex={0} onClick={() => openDetail(row)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) openDetail(row); }} className="cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/50 focus:bg-blue-50 focus:outline-none">
              <td className="px-3 py-3 font-semibold">{row.name}</td><td className="truncate px-3 py-3" title={row.nis}>{row.nis}</td><td className="px-3 py-3">{row.class_name}</td><td className="px-3 py-3">{row.phone}</td><td className="px-3 py-3">{row.gender}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td>
              <td className="px-3 py-3"><div className="flex gap-2"><StatusRowActions item={row} label="siswa" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={setDeleting} onActivate={setActivating} /></div></td>
            </tr>)}</tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">{rows.map(row => <article key={row.id} onClick={() => openDetail(row)} className="cursor-pointer p-4 text-left transition hover:bg-blue-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-slate-500">NIS {row.nis} • {row.class_name}</p><p className="mt-1 text-xs text-slate-500">{row.phone} • {row.gender}</p></div><div className="flex w-24 shrink-0 flex-col items-stretch gap-3"><StatusBadge status={row.status} className="w-full" /><div className="grid grid-cols-2 justify-items-center gap-2 [&>button:only-child]:col-span-2"><StatusRowActions item={row} label="siswa" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={setDeleting} onActivate={setActivating} /></div></div></div></article>)}</div>

        {error && <div className="grid place-items-center px-4 py-16 text-center text-rose-600"><p className="font-semibold">Gagal memuat data siswa</p><p className="mt-1 text-xs">{error}</p><button disabled={loading} onClick={() => { setLoading(true); setRefreshKey(value => value + 1); }} className="mt-4 inline-flex min-w-24 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold disabled:cursor-wait disabled:opacity-70">{loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}{loading ? "Memuat..." : "Coba lagi"}</button></div>}
        {loading && !rows.length && !error && <div className="grid place-items-center px-4 py-16 text-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-slate-500">Memuat data siswa...</p></div>}
        {!loading && !error && !rows.length && <div className="grid place-items-center px-4 py-16 text-center"><Search className="h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">Tidak ada siswa ditemukan</p></div>}

        <footer className="grid min-h-[76px] gap-4 border-t border-slate-200 bg-slate-50/50 px-5 py-4 text-xs text-slate-500 sm:grid-cols-3 sm:items-center"><span>Menampilkan <b className="text-slate-700">{statistics.total_row ? `${statistics.start_row}-${statistics.end_row}` : "0"}</b> dari {statistics.total_row} data</span><div className="flex items-center justify-center gap-1.5"><button disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>{Array.from({ length: Math.min(statistics.max_page || 1, 5) }, (_, index) => index + 1).map(number => <button key={number} disabled={loading} onClick={() => setPage(number)} className={`h-9 w-9 rounded-lg font-semibold ${page === number ? "bg-blue-600 text-white" : "border border-slate-200 bg-white"}`}>{number}</button>)}<button disabled={page >= (statistics.max_page || 1) || loading} onClick={() => setPage(value => value + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div><div className="flex justify-end"><Select value={pageSize} onChange={value => { setPageSize(Number(value)); setPage(1); }} ariaLabel="Jumlah data per halaman" placement="top" className="w-36 sm:w-40" options={[{ value: 5, label: "5 / Halaman" }, { value: 10, label: "10 / Halaman" }, { value: 25, label: "25 / Halaman" }, { value: 50, label: "50 / Halaman" }]} /></div></footer>
      </section>
    </div>
    <FormDrawer open={creating} title="Tambah Siswa" submitLabel="Simpan Siswa" onClose={() => setCreating(false)} onSubmit={saveStudent}>
      <div className="space-y-5">
        {[["Nama Siswa", "name", "text", "Contoh: Ahmad Fauzi"], ["NIS", "nis", "text", "Masukkan nomor induk siswa"], ["Kelas", "class_name", "text", "Contoh: XII IPA - 1"], ["No. HP / WhatsApp", "phone", "tel", "Contoh: 081234567890"]].map(([label, key, type, placeholder]) => <label key={key} className="block text-sm"><span className="mb-2 block font-semibold">{label} <b className="text-rose-500">*</b></span><input required type={type} value={form[key]} placeholder={placeholder} onChange={event => setForm(value => ({ ...value, [key]: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>)}
        <label className="block text-sm"><span className="mb-2 block font-semibold">Jenis Kelamin <b className="text-rose-500">*</b></span><Select value={form.gender} onChange={value => setForm(current => ({ ...current, gender: value }))} ariaLabel="Jenis kelamin" className="w-full" options={["Laki-Laki", "Perempuan"]} /></label>
      </div>
    </FormDrawer>
    <FormDrawer
      open={selected !== null}
      title={editing ? "Edit Siswa" : "Detail Siswa"}
      onClose={() => { setSelected(null); setEditing(false); }}
      onSubmit={saveEdit}
      footerActions={editing ? <><button type="button" onClick={() => { setForm({ ...selected }); setEditing(false); }} className="action-lift rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button><button type="submit" className="action-lift rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Simpan Perubahan</button></> : <><button type="button" onClick={() => setSelected(null)} className="action-lift rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Tutup</button>{access.canDelete && <button type="button" onClick={() => setDeleting(selected)} className="action-lift inline-flex items-center gap-2 rounded-lg border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" />Hapus</button>}{access.canUpdate && <button type="button" onClick={() => setEditing(true)} className="action-lift inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Pencil className="h-4 w-4" />Edit</button>}</>}
    >
      <div className="space-y-5">
        {[["Nama Siswa", "name", "text"], ["NIS", "nis", "text"], ["Kelas", "class_name", "text"], ["No. HP / WhatsApp", "phone", "tel"]].map(([label, key, type]) => <label key={key} className="block text-sm"><span className="mb-2 block font-semibold">{label}</span>{editing ? <input required type={type} value={form[key]} onChange={event => setForm(value => ({ ...value, [key]: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /> : <div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-700">{form[key] || "-"}</div>}</label>)}
        <label className="block text-sm"><span className="mb-2 block font-semibold">Jenis Kelamin</span>{editing ? <Select value={form.gender} onChange={value => setForm(current => ({ ...current, gender: value }))} ariaLabel="Jenis kelamin" className="w-full" options={["Laki-Laki", "Perempuan"]} /> : <div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-700">{form.gender || "-"}</div>}</label>
        {!editing && <div className="text-sm"><span className="mb-2 block font-semibold">Status</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3"><StatusBadge status={form.status} /></div></div>}
      </div>
    </FormDrawer>
    <ConfirmDialog open={activating !== null} title="Aktifkan siswa?" description={activating ? `Siswa ${activating.name} akan diaktifkan.` : ""} confirmLabel="Aktifkan Siswa" tone="success" onConfirm={confirmActivate} onCancel={() => setActivating(null)} />
    <ConfirmDialog open={deleting !== null} title="Hapus siswa?" description={deleting ? `Siswa ${deleting.name} akan dihapus. Tindakan ini tidak dapat dibatalkan.` : ""} confirmLabel="Hapus Siswa" onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
  </>;
}
