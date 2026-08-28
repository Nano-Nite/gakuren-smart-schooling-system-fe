import { useMemo, useState } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, Download, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import FormDrawer from "../components/FormDrawer";
import ConfirmDialog from "../components/ConfirmDialog";
import { getCrudPermissions } from "../utils/permissions";
import Select from "../components/Select";

const initialRows = Array.from({ length: 8 }, (_, index) => ({ id: index + 1, name: `X IPA - ${index + 1}`, level: "10", teacher: index % 3 === 1 ? "Siti Aisyah, S.Pd" : "Ahmad Fauzi, S.Pd", students: 26 + index, status: index === 7 ? "Nonaktif" : "Aktif" }));
const emptyForm = { name: "", level: "10", teacher: "", students: 0, status: "Aktif" };
const fields = [["Nama Kelas", "name", "text", "Contoh: X IPA - 1"], ["Tingkat", "level", "text", "Contoh: 10"], ["Wali Kelas", "teacher", "text", "Contoh: Ahmad Fauzi, S.Pd"], ["Jumlah Siswa", "students", "number", "Contoh: 30"]];
const columns = [["Nama Kelas", "name"], ["Tingkat", "level"], ["Wali Kelas", "teacher"], ["Jumlah Siswa", "students"], ["Status", "status"]];

export default function ClassManagement() {
  const access = getCrudPermissions("class");
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => rows
    .filter(row => `${row.name} ${row.teacher}`.toLowerCase().includes(query.toLowerCase()))
    .filter(row => status === "Semua" || row.status === status)
    .sort((a, b) => {
      const result = String(a[sort.key]).localeCompare(String(b[sort.key]), "id", { numeric: true });
      return sort.direction === "asc" ? result : -result;
    }), [rows, query, status, sort]);
  const displayedRows = filtered.slice(0, pageSize);

  const changeSort = key => setSort(current => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  const openCreate = () => { setForm(emptyForm); setEditing("new"); };
  const openEdit = row => { setForm(row); setEditing(row.id); };
  const save = event => {
    event.preventDefault();
    const value = { ...form, students: Number(form.students) };
    setRows(current => editing === "new" ? [...current, { ...value, id: Date.now() }] : current.map(row => row.id === editing ? { ...value, id: editing } : row));
    setEditing(null);
  };
  const confirmDelete = () => { setRows(current => current.filter(item => item.id !== deleting.id)); setDeleting(null); };

  return <>
    <Helmet><title>Kelas — Gakuren</title></Helmet>
    <div className="p-4 sm:p-6">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex min-w-0 flex-col gap-2 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between lg:gap-4 lg:p-4">
          <div className="flex min-w-0 w-full flex-1 flex-row items-center gap-2 md:w-auto lg:gap-3">
            <button title="Muat ulang" onClick={() => { setQuery(""); setStatus("Semua"); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /></button>
            <label className="relative min-w-0 flex-1 lg:max-w-56"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari data" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />{query && <button aria-label="Hapus pencarian" onClick={() => setQuery("")} className="absolute right-1.5 top-1.5 rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</label>
            <Select value={status} onChange={setStatus} ariaLabel="Filter status" className="w-36 shrink-0 sm:w-40" options={[{ value: "Semua", label: "Semua Status" }, "Aktif", "Nonaktif"]} />
          </div>
          <div className="flex w-full shrink-0 flex-row justify-end gap-1.5 md:w-auto lg:gap-2">
            {access.canCreate && <button title="Import" aria-label="Import" className="action-lift flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 xl:px-4"><Download className="h-4 w-4" /><span className="hidden xl:inline">Import</span></button>}
            <button title="Export" aria-label="Export" className="action-lift flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 xl:px-4"><Upload className="h-4 w-4" /><span className="hidden xl:inline">Export</span></button>
            {access.canCreate && <button onClick={openCreate} className="action-lift flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 md:flex-none lg:px-4"><Plus className="h-4 w-4" /><span>Tambah Kelas</span></button>}
          </div>
        </div>

        <div className="hidden md:block">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-slate-100/80"><tr>{columns.map(([label, key]) => <th key={key} className={`px-3 py-3 font-medium ${key === "level" ? "hidden w-[10%] lg:table-cell" : key === "name" ? "w-[18%]" : key === "teacher" ? "w-[24%]" : key === "students" ? "w-[16%]" : "w-[16%]"}`}><button onClick={() => changeSort(key)} className="group flex max-w-full items-center gap-1 hover:text-blue-600"><span className="truncate">{label}</span><ArrowDownUp className={`h-3 w-3 shrink-0 transition ${sort.key === key ? "text-blue-600 opacity-100" : "opacity-0 group-hover:opacity-60"}`} /></button></th>)}<th className="w-[26%] px-3 py-3 font-medium lg:w-[16%]">Aksi</th></tr></thead>
            <tbody>{displayedRows.map(row => <tr key={row.id} className="group border-t border-slate-100 transition hover:bg-blue-50/50">
              <td className="px-3 py-3 font-semibold text-slate-900">{row.name}</td>
              <td className="hidden px-3 py-3 lg:table-cell">{row.level}</td>
              <td className="truncate px-3 py-3 text-slate-600" title={row.teacher}>{row.teacher}</td>
              <td className="px-3 py-3">{row.students}</td>
              <td className={`px-3 py-3 font-medium ${row.status === "Aktif" ? "text-emerald-600" : "text-slate-500"}`}>{row.status}</td>
              <td className="px-3 py-3"><div className="flex gap-2">{access.canUpdate && <button title="Edit kelas" aria-label={`Edit ${row.name}`} onClick={() => openEdit(row)} className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>}{access.canDelete && <button title="Hapus kelas" aria-label={`Hapus ${row.name}`} onClick={() => setDeleting(row)} className="rounded border border-slate-200 p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}</div></td>
            </tr>)}</tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">{displayedRows.map(row => <article key={row.id} className="p-4 transition hover:bg-blue-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-slate-500">Tingkat {row.level} • {row.students} siswa</p><p className="mt-1 truncate text-xs text-slate-500">{row.teacher}</p></div><span className={`shrink-0 text-xs font-medium ${row.status === "Aktif" ? "text-emerald-600" : "text-slate-500"}`}>{row.status}</span></div>{(access.canUpdate || access.canDelete) && <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">{access.canUpdate && <button onClick={() => openEdit(row)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium">Edit</button>}{access.canDelete && <button onClick={() => setDeleting(row)} className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-medium text-rose-500">Hapus</button>}</div>}</article>)}</div>

        {!filtered.length && <div className="grid place-items-center px-4 py-16 text-center"><Search className="h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">Tidak ada kelas ditemukan</p><p className="mt-1 text-xs text-slate-500">Coba ubah pencarian atau filter status.</p></div>}
        <footer className="grid min-h-[76px] gap-4 border-t border-slate-200 bg-slate-50/50 px-5 py-4 text-xs text-slate-500 sm:grid-cols-3 sm:items-center"><span>Menampilkan <b className="text-slate-700">{filtered.length ? `1-${Math.min(filtered.length, pageSize)}` : "0"}</b> dari {rows.length} data</span><div className="flex items-center justify-center gap-1.5"><button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button><button className="h-9 w-9 rounded-lg bg-blue-600 font-semibold text-white shadow-sm">1</button><button className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100">2</button><button className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100">3</button><button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button></div><div className="flex justify-end"><Select value={pageSize} onChange={value => setPageSize(Number(value))} ariaLabel="Jumlah data per halaman" placement="top" className="w-36 sm:w-40" options={[{ value: 10, label: "10 / Halaman" }, { value: 25, label: "25 / Halaman" }, { value: 50, label: "50 / Halaman" }]} /></div></footer>
      </section>
    </div>

    <FormDrawer open={editing !== null} title={editing === "new" ? "Tambah Kelas" : "Edit Kelas"} onClose={() => setEditing(null)} onSubmit={save}><div className="space-y-5">{fields.map(([label, key, type, placeholder]) => <label key={key} className="block text-sm"><span className="mb-2 block font-semibold">{label} <b className="text-rose-500">*</b></span><input required min={type === "number" ? 0 : undefined} type={type} value={form[key]} placeholder={placeholder} onChange={event => setForm(value => ({ ...value, [key]: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>)}</div></FormDrawer>
    <ConfirmDialog open={deleting !== null} title="Hapus kelas?" description={deleting ? `Kelas ${deleting.name} akan dihapus. Tindakan ini tidak dapat dibatalkan.` : ""} confirmLabel="Hapus Kelas" onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
  </>;
}
