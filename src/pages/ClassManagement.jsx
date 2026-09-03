import { useEffect, useState } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp, CheckCircle2, Clock3, Download, Info, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import FormDrawer from "../components/FormDrawer";
import ConfirmDialog from "../components/ConfirmDialog";
import { getCrudPermissions } from "../utils/permissions";
import Select from "../components/Select";
import API_CONFIG from "../config/api";
import { authenticatedRequest } from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import StatusRowActions from "../components/StatusRowActions";
import UnsavedChangesDialog from "../components/UnsavedChangesDialog";
import TablePagination from "../components/TablePagination";

const emptyForm = { name: "", abbr_name: "", level: "10", teacher: "", students: 0, status: "Aktif" };
const columns = [["Nama Kelas", "name"], ["Tingkat", "level"], ["Wali Kelas", "teacher"], ["Jumlah Siswa", "students"], ["Status", "status"]];
const sortApiKeys = { teacher: "homeroom_teacher", students: "total_student" };
const statusApiValues = { Aktif: "active", Nonaktif: "inactive", Menunggu: "pending" };
const statusLabels = { active: "Aktif", inactive: "Nonaktif", pending: "Pending" };

const validateClassField = (key, value) => {
  const input = String(value ?? "").trim();
  if ((key === "name" || key === "level") && !input) return "Field ini wajib diisi.";
  if ((key === "name" || key === "abbr_name") && input && !/^[\p{L}\d\s./-]+$/u.test(input)) return "Hanya huruf, angka, spasi, titik, garis miring, dan tanda hubung yang diperbolehkan.";
  if (key === "name" && (input.length < 2 || input.length > 100)) return "Nama kelas harus terdiri dari 2–100 karakter.";
  if (key === "abbr_name" && input.length > 30) return "Singkatan kelas maksimal 30 karakter.";
  if (key === "level" && (!/^\d+$/.test(input) || Number(input) < 1 || Number(input) > 12)) return "Tingkat harus berupa bilangan bulat antara 1 dan 12.";
  if (key === "teacher" && input && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input)) return "Masukkan UUID guru yang valid atau kosongkan field ini.";
  if (key === "students" && (!/^\d+$/.test(input) || Number(input) < 0)) return "Jumlah siswa harus berupa bilangan bulat nol atau lebih.";
  return "";
};

export default function ClassManagement() {
  const access = getCrudPermissions("class");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [statistics, setStatistics] = useState({ start_row: 0, end_row: 0, total_row: 0, max_page: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [activating, setActivating] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [noticeTone, setNoticeTone] = useState("success");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const classFormDirty = editing === "new"
    ? JSON.stringify(form) !== JSON.stringify(emptyForm)
    : editing !== null && JSON.stringify(form) !== JSON.stringify(selected || rows.find(row => row.id === editing) || form);

  useEffect(() => {
    if (!classFormDirty) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [classFormDirty]);

  useEffect(() => {
    if (!access.canView) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await authenticatedRequest(API_CONFIG.GET_CLASSES, {
          method: "POST",
          signal: controller.signal,
          body: {
            search: query.trim() || null,
            filter: status === "Semua" ? null : { status: statusApiValues[status] },
            page,
            row_per_page: pageSize,
            sort_by: [{ [sortApiKeys[sort.key] || sort.key]: sort.direction }],
          },
        });
        const payload = response.data || {};
        setError("");
        setRows((payload.result || []).map(item => {
          const itemStatus = item.status ?? item.Status;
          return {
            id: item.uuid ?? item.UUID,
            name: item.name ?? item.Name,
            abbr_name: item.abbr_name ?? item.AbbrName ?? item.name ?? item.Name,
            level: item.level ?? item.Level,
            teacher: item.homeroom_teacher ?? item.HomeroomTeacher ?? "-",
            homeroom_teacher: item.homeroom_teacher ?? item.HomeroomTeacher ?? null,
            students: item.total_student ?? item.TotalStudent ?? 0,
            status: statusLabels[String(itemStatus).toLowerCase()] || itemStatus || "-",
          };
        }));
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

  const displayedRows = rows;

  const changeSort = key => { setPage(1); setSort(current => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" })); };
  const openCreate = () => {
    if (!access.canCreate) return;
    setForm(emptyForm);
    setFormError("");
    setFieldErrors({});
    setEditing("new");
  };
  const openEdit = row => { setForm(row); setFormError(""); setFieldErrors({}); setEditing(row.id); };
  const openDetail = row => { setForm(row); setSelected(row); };
  const confirmActivate = async () => {
    if (!activating || saving) return;
    setSaving(true);
    try {
      await authenticatedRequest(API_CONFIG.UPDATE_CLASS, {
        method: "PATCH",
        body: {
          uuid: activating.id,
          name: activating.name,
          abbr_name: activating.abbr_name,
          level: Number(activating.level),
          homeroom_teacher: activating.homeroom_teacher,
          status: "active",
        },
      });
      setActivating(null);
      setNoticeTone("success");
      setSuccessMessage(`Kelas ${activating.name} berhasil diaktifkan.`);
      setRefreshKey(value => value + 1);
      window.setTimeout(() => setSuccessMessage(""), 5000);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const save = async event => {
    event.preventDefault();
    if (saving) return;
    setFormError("");

    const fieldsToValidate = editing === "new" ? ["name", "abbr_name", "level", "teacher"] : ["name", "level", "teacher", "students"];
    const validationErrors = Object.fromEntries(fieldsToValidate.map(key => [key, validateClassField(key, form[key])]).filter(([, message]) => message));
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    if (editing === "new") {
      if (!access.canCreate) {
        setFormError("Anda tidak memiliki izin untuk membuat kelas.");
        return;
      }

      setSaving(true);
      try {
        await authenticatedRequest(API_CONFIG.CREATE_CLASS, {
          method: "POST",
          body: {
            name: form.name.trim(),
            abbr_name: form.abbr_name.trim() || null,
            level: Number(form.level),
            homeroom_teacher: form.teacher.trim() || null,
          },
        });
        setEditing(null);
        setNoticeTone("success");
        setSuccessMessage(`Kelas ${form.name.trim()} berhasil dibuat.`);
        setRefreshKey(value => value + 1);
        window.setTimeout(() => setSuccessMessage(""), 5000);
      } catch (requestError) {
        setFormError(requestError.message);
      } finally {
        setSaving(false);
      }
      return;
    }

    const value = { ...form, students: Number(form.students) };
    setRows(current => current.map(row => row.id === editing ? { ...value, id: editing } : row));
    setEditing(null);
  };
  const openDelete = item => { setDeleteError(""); setDeleting(item); };
  const confirmDelete = async () => {
    if (!deleting || deleteSubmitting) return;
    setDeleteSubmitting(true);
    setDeleteError("");
    try {
      const response = await authenticatedRequest(API_CONFIG.DELETE_CLASS, { method: "DELETE", body: { uuid: deleting.id } });
      const responseData = response.data || {};
      const responseStatus = String(responseData.status ?? responseData.Status ?? "").toLowerCase();
      const pendingApproval = responseStatus === "pending" || Boolean(responseData.approval_uuid ?? responseData.approvalUUID ?? responseData.is_pending);
      const deletedName = deleting.name;
      setDeleting(null);
      setSelected(null);
      setPage(1);
      setStatus(pendingApproval ? "Menunggu" : "Semua");
      setNoticeTone(pendingApproval ? "pending" : responseStatus ? "success" : "info");
      setSuccessMessage(pendingApproval ? `Penghapusan kelas ${deletedName} berhasil diajukan dan sedang menunggu persetujuan.` : responseStatus ? `Kelas ${deletedName} berhasil dihapus.` : `Permintaan penghapusan kelas ${deletedName} berhasil dikirim. Status terbaru dimuat dari server.`);
      setRefreshKey(value => value + 1);
      window.setTimeout(() => setSuccessMessage(""), 5000);
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };
  const updateCreateField = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    if (fieldErrors[key]) setFieldErrors(current => ({ ...current, [key]: validateClassField(key, value) }));
  };
  const validateCreateField = key => {
    setFieldErrors(current => ({ ...current, [key]: validateClassField(key, form[key]) }));
  };
  const requestFormClose = () => { if (!saving) classFormDirty ? setShowUnsavedWarning(true) : setEditing(null); };

  return <>
    <Helmet><title>Kelas — Gakuren</title></Helmet>
    <div className="p-4 sm:p-6">
      {successMessage && <div role="status" className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${noticeTone === "pending" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : noticeTone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"}`}>{noticeTone === "pending" ? <Clock3 className="h-5 w-5" /> : noticeTone === "success" ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}{successMessage}</div>}
      <section className="data-table-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex min-w-0 flex-col gap-2 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between lg:gap-4 lg:p-4">
          <div className="flex min-w-0 w-full flex-1 flex-row items-center gap-2 md:w-auto lg:gap-3">
            <button title="Muat ulang" onClick={() => setRefreshKey(value => value + 1)} disabled={loading} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
            <label className="relative min-w-0 flex-1 lg:max-w-56"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Cari data" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />{query && <button aria-label="Hapus pencarian" onClick={() => { setQuery(""); setPage(1); }} className="absolute right-1.5 top-1.5 rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</label>
            <Select value={status} onChange={value => { setStatus(value); setPage(1); }} ariaLabel="Filter status" className="w-36 shrink-0 sm:w-40" options={[{ value: "Semua", label: "Semua Status" }, "Aktif", "Nonaktif", "Menunggu"]} />
          </div>
          <div className="flex w-full shrink-0 flex-row justify-end gap-1.5 md:w-auto lg:gap-2">
            {access.canCreate && <button title="Import" aria-label="Import" className="action-lift flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 xl:px-4"><Download className="h-4 w-4" /><span className="hidden xl:inline">Import</span></button>}
            <button title="Export" aria-label="Export" className="action-lift flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 xl:px-4"><Upload className="h-4 w-4" /><span className="hidden xl:inline">Export</span></button>
            {access.canCreate && <button onClick={openCreate} className="action-lift flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 md:flex-none lg:px-4"><Plus className="h-4 w-4" /><span>Tambah Kelas</span></button>}
          </div>
        </div>

        <div className="hidden md:block">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-slate-100/80"><tr>{columns.map(([label, key]) => <th key={key} className={`px-3 py-3 font-medium ${key === "level" ? "hidden w-[10%] lg:table-cell" : key === "name" ? "w-[18%]" : key === "teacher" ? "w-[24%]" : key === "students" ? "w-[16%]" : "w-[16%]"}`}><button onClick={() => changeSort(key)} className={`group flex max-w-full items-center gap-1 hover:text-blue-600 ${sort.key === key ? "font-semibold text-blue-600" : ""}`}><span className="truncate">{label}</span>{sort.key === key ? sort.direction === "asc" ? <ArrowUp className="h-3.5 w-3.5 shrink-0" /> : <ArrowDown className="h-3.5 w-3.5 shrink-0" /> : <ArrowDownUp className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-60" />}</button></th>)}<th className="w-[26%] px-3 py-3 font-medium lg:w-[16%]">Aksi</th></tr></thead>
            <tbody>{displayedRows.map(row => <tr key={row.id} tabIndex={0} onClick={() => openDetail(row)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) openDetail(row); }} className="group cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/50 focus:bg-blue-50 focus:outline-none">
              <td className="px-3 py-3 font-semibold text-slate-900">{row.name}</td>
              <td className="hidden px-3 py-3 lg:table-cell">{row.level}</td>
              <td className="truncate px-3 py-3 text-slate-600" title={row.teacher}>{row.teacher}</td>
              <td className="px-3 py-3">{row.students}</td>
              <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
              <td className="px-3 py-3"><div className="flex gap-2"><StatusRowActions item={row} label="kelas" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={openDelete} onActivate={setActivating} /></div></td>
            </tr>)}</tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">{displayedRows.map(row => <article key={row.id} onClick={() => openDetail(row)} className="cursor-pointer p-4 transition hover:bg-blue-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-slate-500">Tingkat {row.level} • {row.students} siswa</p><p className="mt-1 truncate text-xs text-slate-500">{row.teacher}</p></div><div className="flex w-24 shrink-0 flex-col items-stretch gap-3"><StatusBadge status={row.status} className="w-full" /><div className="grid grid-cols-2 justify-items-center gap-2 [&>button:only-child]:col-span-2"><StatusRowActions item={row} label="kelas" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={openDelete} onActivate={setActivating} /></div></div></div></article>)}</div>

        {error && <div className="grid place-items-center px-4 py-16 text-center text-rose-600"><p className="font-semibold">Gagal memuat data kelas</p><p className="mt-1 text-xs">{error}</p><button disabled={loading} onClick={() => { setLoading(true); setRefreshKey(value => value + 1); }} className="mt-4 inline-flex min-w-24 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold hover:bg-rose-50 disabled:cursor-wait disabled:opacity-70">{loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}{loading ? "Memuat..." : "Coba lagi"}</button></div>}
        {loading && !rows.length && <div className="grid place-items-center px-4 py-16 text-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-slate-500">Memuat data kelas...</p></div>}
        {!loading && !error && !rows.length && <div className="grid place-items-center px-4 py-16 text-center"><Search className="h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">Tidak ada kelas ditemukan</p><p className="mt-1 text-xs text-slate-500">Coba ubah pencarian atau filter status.</p></div>}
        <TablePagination page={page} pageCount={statistics.max_page} pageSize={pageSize} total={statistics.total_row} start={statistics.start_row} end={statistics.end_row} loading={loading} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} />
      </section>
    </div>

    <FormDrawer open={editing !== null} title={editing === "new" ? "Tambah Kelas" : "Edit Kelas"} noValidate onClose={requestFormClose} onSubmit={save} submitLabel={saving ? "Menyimpan..." : "Simpan"} submitting={saving}>
      <div className="space-y-5">
        {formError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{formError}</div>}
        <label className="block text-sm"><span className="mb-2 block font-semibold">Nama Kelas <b className="text-rose-500">*</b></span><input required maxLength={100} value={form.name} placeholder="Contoh: X-IPS-1" aria-invalid={Boolean(fieldErrors.name)} onChange={event => updateCreateField("name", event.target.value)} onBlur={() => validateCreateField("name")} className={`w-full rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${fieldErrors.name ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />{fieldErrors.name && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{fieldErrors.name}</span>}</label>
        {editing === "new" && <label className="block text-sm"><span className="mb-2 block font-semibold">Singkatan Kelas <span className="font-normal text-slate-400">(opsional)</span></span><input maxLength={30} value={form.abbr_name} placeholder="Contoh: X IPS 1" aria-invalid={Boolean(fieldErrors.abbr_name)} onChange={event => updateCreateField("abbr_name", event.target.value)} onBlur={() => validateCreateField("abbr_name")} className={`w-full rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${fieldErrors.abbr_name ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />{fieldErrors.abbr_name && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{fieldErrors.abbr_name}</span>}</label>}
        <label className="block text-sm"><span className="mb-2 block font-semibold">Tingkat <b className="text-rose-500">*</b></span><input required min="1" max="12" step="1" type="number" value={form.level} placeholder="Contoh: 10" aria-invalid={Boolean(fieldErrors.level)} onChange={event => updateCreateField("level", event.target.value)} onBlur={() => validateCreateField("level")} className={`w-full rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${fieldErrors.level ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />{fieldErrors.level && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{fieldErrors.level}</span>}</label>
        <label className="block text-sm"><span className="mb-2 block font-semibold">Wali Kelas <span className="font-normal text-slate-400">(opsional)</span></span><input value={form.teacher} placeholder="UUID guru, atau kosongkan" aria-invalid={Boolean(fieldErrors.teacher)} onChange={event => updateCreateField("teacher", event.target.value)} onBlur={() => validateCreateField("teacher")} className={`w-full rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${fieldErrors.teacher ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />{fieldErrors.teacher ? <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{fieldErrors.teacher}</span> : <span className="mt-1.5 block text-xs text-slate-500">Wali kelas dapat ditentukan nanti jika belum tersedia.</span>}</label>
        {editing !== "new" && <label className="block text-sm"><span className="mb-2 block font-semibold">Jumlah Siswa <b className="text-rose-500">*</b></span><input required min="0" step="1" type="number" value={form.students} aria-invalid={Boolean(fieldErrors.students)} onChange={event => updateCreateField("students", event.target.value)} onBlur={() => validateCreateField("students")} className={`w-full rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${fieldErrors.students ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />{fieldErrors.students && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{fieldErrors.students}</span>}</label>}
      </div>
    </FormDrawer>
    <FormDrawer
      open={selected !== null}
      title="Detail Kelas"
      onClose={() => setSelected(null)}
      onSubmit={event => event.preventDefault()}
      footerActions={<><button type="button" onClick={() => setSelected(null)} className="action-lift rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Tutup</button>{selected?.status === "Nonaktif" ? access.canUpdate && <button type="button" onClick={() => { setActivating(selected); setSelected(null); }} className="action-lift inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" />Aktifkan</button> : <>{access.canDelete && <button type="button" disabled={selected?.status === "Pending"} onClick={() => { setDeleting(selected); setSelected(null); }} className="action-lift inline-flex items-center gap-2 rounded-lg border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" />Hapus</button>}{access.canUpdate && <button type="button" disabled={selected?.status === "Pending"} onClick={() => { const row = selected; setSelected(null); openEdit(row); }} className="action-lift inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><Pencil className="h-4 w-4" />Edit</button>}</>}</>}
    >
      <div className="space-y-5">
        {[["Nama Kelas", "name"], ["Tingkat", "level"], ["Wali Kelas", "teacher"], ["Jumlah Siswa", "students"], ["Status", "status"]].map(([label, key]) => <div key={key} className="text-sm"><span className="mb-2 block font-semibold">{label}</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-700">{key === "status" ? <StatusBadge status={form.status} /> : form[key] ?? "-"}</div></div>)}
      </div>
    </FormDrawer>
    <ConfirmDialog open={activating !== null} title="Aktifkan kelas?" description={formError || (activating ? `Kelas ${activating.name} akan diaktifkan.` : "")} confirmLabel={saving ? "Mengaktifkan..." : "Aktifkan Kelas"} tone="success" onConfirm={confirmActivate} onCancel={() => { if (!saving) { setActivating(null); setFormError(""); } }} />
    <ConfirmDialog open={deleting !== null} title="Hapus kelas?" description={deleteError || (deleting ? `Kelas ${deleting.name} akan dihapus. Tindakan ini tidak dapat dibatalkan.` : "")} confirmLabel={deleteSubmitting ? "Menghapus..." : "Hapus Kelas"} onConfirm={confirmDelete} onCancel={() => { if (!deleteSubmitting) { setDeleting(null); setDeleteError(""); } }} />
    <UnsavedChangesDialog open={showUnsavedWarning} onContinue={() => setShowUnsavedWarning(false)} onDiscard={() => { setShowUnsavedWarning(false); setEditing(null); }} />
  </>;
}
