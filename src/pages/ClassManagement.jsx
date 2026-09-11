import { notify } from "../utils/notifications";
import ExpandableBadges from "../components/ExpandableBadges";
import { getActiveStatusUuid } from "../utils/activeStatus";
import { isStatusMutationBlocked } from "../utils/userStatus";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowDownUp, ArrowUp, CheckCircle2, Clock3, Download, Info, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import FormDrawer from "../components/FormDrawer";
import ClassDetail from "../components/ClassDetail";
import { mergeHomeroomTeacherOptions } from "../utils/homeroomTeacherOptions";
import StatusChangeDialog from "../components/StatusChangeDialog";
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
  // Wali kelas uses a controlled dropdown; existing class data may contain a name instead of a UUID.
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
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [initialTeacher, setInitialTeacher] = useState("");
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState("");
  const [teachersRefreshKey, setTeachersRefreshKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [activating, setActivating] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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
            homeroom_teacher_uuid: item.homeroom_teacher_uuid ?? item.HomeroomTeacherUUID ?? null,
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
  const mergedTeachers = mergeHomeroomTeacherOptions(teacherOptions, initialTeacher);
  const replacingHomeroomTeacher = editing !== null && editing !== "new" && Boolean(initialTeacher)
    && form.teacher !== initialTeacher && form.teacher !== mergedTeachers.initialValue;

  useEffect(() => {
    if (editing === null) return undefined;
    const controller = new AbortController();
    setTeachersLoading(true);
    setTeachersError("");
    setTeacherOptions([]);
    const loadTeachers = async () => {
      try {
        const response = await authenticatedRequest(API_CONFIG.GET_HOMEROOM_TEACHERS, {
          method: "GET",
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const items = Array.isArray(response.data) ? response.data : response.data?.result;
        if (!Array.isArray(items)) throw new Error("Format data wali kelas tidak valid.");
        setTeacherOptions(items.map(item => ({
          value: item.uuid ?? item.UUID,
          label: item.full_name ?? item.FullName ?? item.name ?? item.Name,
          positions: Array.isArray(item.position) ? [...new Set(item.position.filter(position => typeof position === "string" && position.trim()).map(position => position.trim()))] : [],
        })).filter(item => typeof item.value === "string" && typeof item.label === "string"));
      } catch (requestError) {
        if (!controller.signal.aborted) setTeachersError(requestError.message || "Gagal memuat daftar wali kelas.");
      } finally {
        if (!controller.signal.aborted) setTeachersLoading(false);
      }
    };
    loadTeachers();
    return () => controller.abort();
  }, [editing, teachersRefreshKey]);

  const changeSort = key => { setPage(1); setSort(current => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" })); };
  const openCreate = () => {
    if (!access.canCreate) return;
    setForm(emptyForm);
    setInitialTeacher("");
    setFormError("");
    setFieldErrors({});
    setEditing("new");
  };
  const openEdit = row => { if (isStatusMutationBlocked(row.status)) return; setForm(row); setInitialTeacher(row.teacher && row.teacher !== "-" ? row.teacher : ""); setFormError(""); setFieldErrors({}); setEditing(row.id); };
  const openDetail = row => { setForm(row); setSelected(row); };
  const confirmActivate = async () => {
    if (!activating || saving || !access.canUpdate) return;
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
          status: await getActiveStatusUuid(),
        },
      });
      setActivating(null);
      notify(`Kelas ${activating.name} berhasil diaktifkan.`, { tone: "success" });
      setRefreshKey(value => value + 1);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const save = async event => {
    event.preventDefault();
    if (isStatusMutationBlocked(form.status)) return;
    if (saving) return;
    setFormError("");

    const fieldsToValidate = editing === "new" ? ["name", "abbr_name", "level", "teacher"] : ["name", "level", "teacher"];
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
        notify(`Kelas ${form.name.trim()} berhasil dibuat.`, { tone: "success" });
        setRefreshKey(value => value + 1);
      } catch (requestError) {
        setFormError(requestError.message);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!access.canUpdate) {
      setFormError("Anda tidak memiliki izin untuk mengubah kelas.");
      return;
    }
    const teacherChanged = form.teacher !== initialTeacher && form.teacher !== mergedTeachers.initialValue;
    const teacherUuid = form.teacher.trim();
    if (teacherChanged && teacherUuid && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherUuid)) {
      setFormError("Guru pengganti tidak valid. Silakan pilih kembali dari daftar wali kelas.");
      return;
    }
    setSaving(true);
    try {
      const response = await authenticatedRequest(API_CONFIG.UPDATE_CLASS, {
        method: "PATCH",
        body: {
          uuid: editing,
          name: form.name.trim(),
          abbr_name: form.abbr_name?.trim() || null,
          level: Number(form.level),
          // Preserve the assignment when unchanged; list responses may only contain its display name.
          ...(teacherChanged ? { homeroom_teacher: teacherUuid || null } : {}),
        },
      });
      const payload = response.data || {};
      const pendingApproval = String(payload.status ?? payload.Status ?? "").toLowerCase() === "pending"
        || Boolean(payload.approval_uuid ?? payload.approvalUUID ?? payload.is_pending);
      setEditing(null);
      notify(pendingApproval ? `Perubahan kelas ${form.name.trim()} berhasil diajukan dan menunggu persetujuan.` : `Perubahan kelas ${form.name.trim()} berhasil dikirim.`, { tone: pendingApproval ? "pending" : "success" });
      setRefreshKey(value => value + 1);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const openDelete = item => { if (isStatusMutationBlocked(item.status)) return; setDeleteError(""); setDeleting(item); };
  const confirmDelete = async () => {
    if (isStatusMutationBlocked(deleting?.status)) return;
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
      notify(pendingApproval ? `Penonaktifan kelas ${deletedName} berhasil diajukan dan sedang menunggu persetujuan.` : responseStatus ? `Kelas ${deletedName} berhasil dinonaktifkan.` : `Permintaan penonaktifan kelas ${deletedName} berhasil dikirim. Status terbaru dimuat dari server.`, { tone: pendingApproval ? "pending" : responseStatus ? "success" : "info" });
      setRefreshKey(value => value + 1);
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
    <Helmet><title>Kelas | Gakuren</title></Helmet>
    <div className="p-4 sm:p-6">
      
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

        <div className="divide-y divide-slate-100 md:hidden">{displayedRows.map(row => <article key={row.id} onClick={() => openDetail(row)} className="cursor-pointer p-4 transition hover:bg-blue-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-slate-500">Tingkat {row.level} • {row.students} siswa</p><p className="mt-1 truncate text-xs text-slate-500">{row.teacher}</p></div><div className="flex w-28 shrink-0 flex-col items-stretch gap-3"><StatusBadge status={row.status} className="w-full" /><div className="grid grid-cols-2 justify-items-center gap-2 [&>button:only-child]:col-span-2"><StatusRowActions item={row} label="kelas" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={openDelete} onActivate={setActivating} /></div></div></div></article>)}</div>

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
        <div className="text-sm">
          <label htmlFor="class-homeroom-teacher" className="mb-2 block font-semibold">Wali Kelas <span className="font-normal text-slate-400">(opsional)</span></label>
          <Select
            id="class-homeroom-teacher"
            ariaLabel="Wali Kelas"
            renderOption={option => <span className="block min-w-0">
              <span className="block truncate font-medium">{option.label}</span>
              {option.positions?.length > 0 && <span className="mt-1.5 block"><ExpandableBadges items={option.positions} /></span>}
            </span>}
            size="large"
            value={form.teacher === initialTeacher ? mergedTeachers.initialValue : form.teacher}
            disabled={teachersLoading || saving}
            aria-invalid={Boolean(fieldErrors.teacher)}
            aria-describedby="class-homeroom-teacher-help"
            onChange={value => updateCreateField("teacher", value)}
            onBlur={() => validateCreateField("teacher")}
            options={[
              { value: "", label: teachersLoading ? "Memuat daftar guru..." : "Tanpa wali kelas", group: "Belum ada wali kelas" },
              ...[...mergedTeachers.options].sort((a, b) => Number(b.value === mergedTeachers.initialValue) - Number(a.value === mergedTeachers.initialValue)).map(option => ({
                group: initialTeacher && option.value === mergedTeachers.initialValue ? "Wali kelas saat ini" : "Calon wali kelas",
                value: option.value,
                title: [option.label, ...option.positions].join(" — "),
                label: option.label,
                positions: option.positions,
              })),
            ]}
          />
          <div id="class-homeroom-teacher-help" className="mt-1.5 text-xs">
            {replacingHomeroomTeacher && <div role="alert" className="my-3 rounded-lg border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/40 dark:border-l-amber-400 dark:bg-amber-400/10 dark:text-amber-100">
              <div className="flex items-start gap-2.5">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">{form.teacher ? "Wali kelas akan diganti" : "Penugasan wali kelas akan dicabut"}</p>
                  <p className="mt-1.5 leading-5">Setelah pengajuan disetujui:</p>
                  <ul className="mt-1 list-disc space-y-1.5 pl-4 leading-5">
                    <li>Guru saat ini kehilangan posisi <strong>Wali Kelas</strong> dan dapat ditugaskan ke kelas lain.</li>
                    <li>{form.teacher ? <>Guru pengganti mengambil alih kelas ini dan memperoleh posisi <strong>Wali Kelas</strong>.</> : <>Kelas ini <strong>tidak memiliki wali kelas</strong> hingga guru pengganti ditentukan.</>}</li>
                  </ul>
                  <p className="mt-3 border-t border-amber-300/70 pt-2.5 font-medium leading-5 dark:border-amber-400/20">Pastikan perubahan penugasan ini sudah sesuai sebelum menyimpan.</p>
                </div>
              </div>
            </div>}
            {editing === "new" && form.teacher && <p className="mb-1.5 leading-relaxed text-blue-700 dark:text-blue-300">Penambahan kelas dengan guru ini sebagai wali kelas akan otomatis menambahkan posisi Wali Kelas kepada guru tersebut setelah pengajuan disetujui.</p>}
            {fieldErrors.teacher && <p role="alert" className="font-medium text-rose-600">{fieldErrors.teacher}</p>}
            {teachersError ? <div role="alert" className="text-rose-600"><p>{teachersError}</p><button type="button" onClick={() => setTeachersRefreshKey(value => value + 1)} className="mt-1 font-semibold underline">Coba lagi</button></div> : (teachersLoading || editing === "new") && <p role="status" className="text-slate-500">{teachersLoading ? "Memuat daftar wali kelas..." : teacherOptions.length || initialTeacher ? "Wali kelas dapat ditentukan nanti jika belum tersedia." : "Belum ada guru tersedia. Wali kelas dapat ditentukan nanti."}</p>}
          </div>
        </div>
      </div>
    </FormDrawer>
    <FormDrawer
      open={selected !== null}
      title="Detail Kelas"
      onClose={() => setSelected(null)}
      onSubmit={event => event.preventDefault()}
      footerActions={<><button type="button" onClick={() => setSelected(null)} className="action-lift rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Tutup</button>{selected?.status === "Nonaktif" ? access.canUpdate && <button type="button" onClick={() => { setActivating(selected); setSelected(null); }} className="action-lift inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" />Aktifkan</button> : <>{access.canDelete && <button type="button" disabled={isStatusMutationBlocked(selected?.status)} onClick={() => { setDeleting(selected); setSelected(null); }} className="action-lift inline-flex items-center gap-2 rounded-lg border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" />Nonaktifkan</button>}{access.canUpdate && <button type="button" disabled={isStatusMutationBlocked(selected?.status)} onClick={() => { const row = selected; setSelected(null); openEdit(row); }} className="action-lift inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><Pencil className="h-4 w-4" />Edit</button>}</>}</>}
    >
      <ClassDetail data={selected || form} />
    </FormDrawer>
    <StatusChangeDialog item={activating} entityLabel="kelas" action="activate" submitting={saving} error={formError} onConfirm={confirmActivate} onCancel={() => { if (!saving) { setActivating(null); setFormError(""); } }} />
    <StatusChangeDialog item={deleting} entityLabel="kelas" submitting={deleteSubmitting} error={deleteError} onConfirm={confirmDelete} onCancel={() => { if (!deleteSubmitting) { setDeleting(null); setDeleteError(""); } }} />
    <UnsavedChangesDialog open={showUnsavedWarning} onContinue={() => setShowUnsavedWarning(false)} onDiscard={() => { setShowUnsavedWarning(false); setEditing(null); }} />
  </>;
}
