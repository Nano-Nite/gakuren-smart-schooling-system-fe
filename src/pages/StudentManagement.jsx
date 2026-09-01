import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Info, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
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
  ["NISN", "nisn"],
  ["Kelas", "class_name"],
  ["No. HP / WhatsApp", "phone"],
  ["Jenis Kelamin", "gender"],
  ["Status", "status"],
];
const statusApiValues = { Aktif: "active", Nonaktif: "inactive", Menunggu: "pending" };
const statusLabels = { active: "Aktif", inactive: "Nonaktif", pending: "Pending" };
const emptyForm = { name: "", nis: "", nisn: "", class_uuid: "", class_name: "", email: "", phone: "", address: "", gender_uuid: "", gender: "", status: "Aktif", parent_name: "", parent_email: "", parent_phone: "", parent_address: "" };

const validateStudentField = (key, value) => {
  const trimmedValue = String(value || "").trim();
  if (!trimmedValue) return "Field ini wajib diisi.";
  if ((key === "name" || key === "parent_name") && !/^[\p{L}\s.'-]+$/u.test(trimmedValue)) return "Nama hanya boleh berisi huruf, spasi, titik, apostrof, dan tanda hubung.";
  if ((key === "name" || key === "parent_name") && (trimmedValue.length < 2 || trimmedValue.length > 100)) return "Nama harus terdiri dari 2–100 karakter.";
  if (key === "nis" && !/^\d{4,20}$/.test(trimmedValue)) return "NIS harus terdiri dari 4–20 digit tanpa spasi atau karakter khusus.";
  if (key === "nisn" && !/^\d{10}$/.test(trimmedValue)) return "NISN harus terdiri dari tepat 10 digit.";
  if (key === "class_uuid" && !trimmedValue) return "Pilih kelas aktif dari daftar.";
  if (key === "gender_uuid" && !trimmedValue) return "Pilih jenis kelamin aktif dari daftar.";
  if ((key === "email" || key === "parent_email") && (trimmedValue.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedValue))) return "Masukkan alamat email yang valid.";
  if ((key === "phone" || key === "parent_phone") && !/^(?:\+62|62|0)8\d{7,12}$/.test(trimmedValue)) return "Gunakan nomor Indonesia yang valid, misalnya 081234567890 atau +6281234567890.";
  if ((key === "address" || key === "parent_address") && (!/^[\p{L}\d\s.,'#/()-]+$/u.test(trimmedValue) || trimmedValue.length < 5 || trimmedValue.length > 255)) return "Alamat harus 5–255 karakter dan hanya boleh memakai huruf, angka, spasi, serta tanda baca alamat.";
  return "";
};

function ValidatedInput({ label, name, type = "text", value, placeholder, error, onChange, onBlur, disabled = false }) {
  return <label className="block text-sm">
    <span className="mb-2 block font-semibold">{label} <b className="text-rose-500">*</b></span>
    <input disabled={disabled} type={type} inputMode={type === "tel" || name === "nis" || name === "nisn" ? "numeric" : undefined} value={value} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} onChange={onChange} onBlur={onBlur} className={`w-full rounded-lg border bg-white px-3.5 py-3 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-700 ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />
    {error && <span id={`${name}-error`} role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </label>;
}

function ClassPicker({ value, selectedName, error, onChange, onBlur }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedName || "");
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => { if (selectedName || !open) setQuery(selectedName || ""); }, [open, selectedName]);
  useEffect(() => {
    const closeOnOutsidePress = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const closeOnEscape = event => {
      if (event.key !== "Escape" || !open) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress, true);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress, true);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await authenticatedRequest(API_CONFIG.GET_CLASSES, {
          method: "POST",
          signal: controller.signal,
          body: { search: query.trim() || null, filter: { status: "active" }, page, row_per_page: 8, sort_by: [{ name: "asc" }] },
        });
        const payload = response.data || {};
        const activeOptions = (payload.result || []).map(item => ({ uuid: item.uuid ?? item.UUID, name: item.name ?? item.Name ?? "-", teacher: item.homeroom_teacher_name ?? item.HomeroomTeacherName ?? item.homeroom_teacher ?? item.HomeroomTeacher ?? "Belum ada wali kelas", status: String(item.status ?? item.Status ?? "").toLowerCase() })).filter(item => item.uuid && (!item.status || item.status === "active"));
        setOptions(activeOptions);
        if (!value && selectedName) {
          const matchingOption = activeOptions.find(option => String(option.name).toLowerCase() === String(selectedName).toLowerCase());
          if (matchingOption) onChange(matchingOption.uuid, matchingOption.name);
        }
        setMaxPage(Math.max(1, Number(payload.data_statistic?.max_page) || 1));
        setRequestError("");
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") { setOptions([]); setRequestError(fetchError.message); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 1500);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, page, query]);

  return <div ref={rootRef} className="relative text-sm">
    <label htmlFor="student-class-picker" className="mb-2 block font-semibold">Kelas <b className="text-rose-500">*</b></label>
    <input id="student-class-picker" name="student_class_search" type="search" role="combobox" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} data-lpignore="true" data-1p-ignore="true" data-form-type="other" aria-autocomplete="list" aria-expanded={open} aria-controls="student-class-options" aria-invalid={Boolean(error)} value={query} placeholder="Ketik untuk mencari kelas" onFocus={() => setOpen(true)} onBlur={event => { onBlur?.(); window.setTimeout(() => { if (!rootRef.current?.contains(document.activeElement)) setOpen(false); }, 0); }} onChange={event => { setQuery(event.target.value); setPage(1); onChange("", ""); setOpen(true); }} className={`w-full appearance-none rounded-lg border bg-white px-3.5 py-3 outline-none [&::-webkit-search-cancel-button]:hidden focus:ring-2 ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />
    {error && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
    {open && <div id="student-class-options" role="listbox" className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
      <div className="max-h-64 overflow-y-auto p-1.5">
        {loading ? <div className="flex items-center justify-center gap-2 px-3 py-6 text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Memuat kelas…</div> : requestError ? <p className="px-3 py-4 text-center text-xs text-rose-600">{requestError}</p> : options.length ? options.map(option => <button key={option.uuid} type="button" role="option" aria-selected={String(value) === String(option.uuid)} onMouseDown={event => event.preventDefault()} onClick={() => { onChange(option.uuid, option.name); setQuery(option.name); setOpen(false); }} className={`block w-full rounded-lg px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-slate-700 ${String(value) === String(option.uuid) ? "bg-blue-50 dark:bg-slate-700" : ""}`}><span className="block font-bold text-slate-800 dark:text-slate-100">{option.name}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Wali kelas: {option.teacher}</span></button>) : <p className="px-3 py-6 text-center text-xs text-slate-500">Kelas aktif tidak ditemukan.</p>}
      </div>
      {maxPage > 1 && <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs dark:border-slate-700"><button type="button" disabled={page <= 1 || loading} onMouseDown={event => event.preventDefault()} onClick={() => setPage(current => current - 1)} className="font-semibold text-blue-600 disabled:opacity-40">Sebelumnya</button><span className="text-slate-500">Halaman {page} / {maxPage}</span><button type="button" disabled={page >= maxPage || loading} onMouseDown={event => event.preventDefault()} onClick={() => setPage(current => current + 1)} className="font-semibold text-blue-600 disabled:opacity-40">Berikutnya</button></div>}
    </div>}
  </div>;
}

function GenderSelect({ value, selectedName, error, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const response = await authenticatedRequest(API_CONFIG.GET_GENDERS, {
          method: "POST",
          signal: controller.signal,
          body: { search: null, filter: { status: "active" }, page: 1, row_per_page: 20, sort_by: [{ status: "desc" }] },
        });
        const payload = response.data || {};
        const activeOptions = (payload.result || []).map(item => {
          const label = item.name ?? item.Name ?? item.label ?? item.Label ?? item.value ?? item.Value ?? item.code ?? item.Code;
          return { value: item.uuid ?? item.UUID ?? item.id ?? item.ID ?? item.code ?? item.Code ?? label, label, status: String(item.status ?? item.Status ?? "").toLowerCase() };
        }).filter(item => item.value && item.label && (!item.status || item.status === "active"));
        setOptions(activeOptions);
        setRequestError("");
        if (!value && activeOptions[0]) {
          const matchingOption = activeOptions.find(option => String(option.label).toLowerCase() === String(selectedName || "").toLowerCase());
          const defaultOption = matchingOption || activeOptions[0];
          onChange(defaultOption.value, defaultOption.label);
        }
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") { setOptions([]); setRequestError(fetchError.message); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [refreshKey]);

  return <label className="block text-sm"><span className="mb-2 block font-semibold">Jenis Kelamin <b className="text-rose-500">*</b></span>
    {loading ? <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Memuat jenis kelamin…</div> : requestError ? <button type="button" onClick={() => setRefreshKey(current => current + 1)} className="flex h-10 w-full items-center justify-between rounded-lg border border-rose-300 px-3 text-left text-rose-600"><span className="truncate">Gagal memuat: {requestError}</span><span className="font-semibold">Coba lagi</span></button> : options.length ? <Select value={value} onChange={selectedValue => { const selected = options.find(option => String(option.value) === String(selectedValue)); onChange(selectedValue, selected?.label || ""); }} ariaLabel="Jenis kelamin" className="w-full" options={options} /> : <div className="flex h-10 items-center rounded-lg border border-slate-200 px-3 text-slate-500">Jenis kelamin aktif tidak ditemukan.</div>}
    {error && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </label>;
}

export default function StudentManagement() {
  const access = getCrudPermissions("student");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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
  const [addParentContact, setAddParentContact] = useState(false);
  const [sameParentAddress, setSameParentAddress] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [noticeTone, setNoticeTone] = useState("pending");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
          nisn: student.NISN ?? student.Nisn ?? student.nisn ?? "-",
          class_uuid: student.ClassUUID ?? student.class_uuid ?? student.ClassUuid ?? "",
          class_name: student.ClassName ?? student.Class ?? student.class_name ?? "-",
          email: student.Email ?? student.email ?? "-",
          phone: student.Phone ?? student.PhoneNumber ?? student.phone ?? "-",
          address: student.Address ?? student.address ?? "-",
          parent_name: student.ParentName ?? student.parent_name ?? "",
          parent_email: student.ParentEmail ?? student.parent_email ?? "",
          parent_phone: student.ParentPhone ?? student.parent_phone ?? "",
          parent_address: student.ParentAddress ?? student.parent_address ?? "",
          gender_uuid: student.GenderUUID ?? student.gender_uuid ?? student.GenderUuid ?? "",
          gender: student.gender_name ?? student.GenderName ?? student.Gender ?? student.gender ?? "-",
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
    setAddParentContact(false);
    setSameParentAddress(true);
    setFormErrors({});
    setCreateError("");
    setCreating(true);
  };
  const saveStudent = async event => {
    event.preventDefault();
    if (createSubmitting) return;
    const requiredFields = ["name", "nis", "nisn", "class_uuid", "email", "phone", "address", "gender_uuid", ...(addParentContact ? ["parent_name", "parent_email", "parent_phone", "parent_address"] : [])];
    const errors = Object.fromEntries(requiredFields.map(key => [key, validateStudentField(key, form[key])]).filter(([, message]) => message));
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    setCreateSubmitting(true);
    setCreateError("");
    try {
      const parentPayload = addParentContact ? {
        parent_name: form.parent_name.trim(),
        parent_email: form.parent_email.trim(),
        parent_phone: form.parent_phone.trim(),
        parent_address: form.parent_address.trim(),
      } : { parent_name: null, parent_email: null, parent_phone: null, parent_address: null };
      await authenticatedRequest(API_CONFIG.CREATE_STUDENT, {
        method: "POST",
        body: {
          name: form.name.trim(),
          nis: form.nis.trim(),
          nisn: form.nisn.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          class_uuid: form.class_uuid,
          address: form.address.trim(),
          gender_uuid: form.gender_uuid,
          ...parentPayload,
        },
      });
      setCreating(false);
      setPage(1);
      setStatus("Menunggu");
      setNoticeTone("pending");
      setSuccessMessage(`Pengajuan siswa ${form.name.trim()} berhasil dikirim dan sedang menunggu persetujuan.`);
      setRefreshKey(value => value + 1);
      window.setTimeout(() => setSuccessMessage(""), 5000);
    } catch (requestError) {
      setCreateError(requestError.message);
    } finally {
      setCreateSubmitting(false);
    }
  };
  const updateCreateField = (key, value) => {
    setForm(current => ({ ...current, [key]: value, ...(key === "address" && sameParentAddress ? { parent_address: value } : {}) }));
    if (formErrors[key]) setFormErrors(current => ({ ...current, [key]: validateStudentField(key, value) }));
    if (key === "address" && sameParentAddress && formErrors.parent_address) setFormErrors(current => ({ ...current, parent_address: validateStudentField("parent_address", value) }));
  };
  const validateCreateField = key => setFormErrors(current => ({ ...current, [key]: validateStudentField(key, form[key]) }));
  const openDetail = student => {
    setFormErrors({});
    setForm({ ...student });
    setAddParentContact(Boolean(student.parent_name || student.parent_email || student.parent_phone || student.parent_address));
    setSameParentAddress(Boolean(student.address && student.parent_address && student.address === student.parent_address));
    setSelected(student);
    setEditing(false);
  };
  const openEdit = student => {
    setFormErrors({});
    setEditError("");
    setForm({ ...student });
    setAddParentContact(Boolean(student.parent_name || student.parent_email || student.parent_phone || student.parent_address));
    setSameParentAddress(Boolean(student.address && student.parent_address && student.address === student.parent_address));
    setSelected(student);
    setEditing(true);
  };
  const saveEdit = async event => {
    event.preventDefault();
    if (!editing || editSubmitting) return;
    const editFields = ["name", "nis", "nisn", "class_uuid", "email", "phone", "address", "gender_uuid", ...(addParentContact ? ["parent_name", "parent_email", "parent_phone", "parent_address"] : [])];
    const errors = Object.fromEntries(editFields.map(key => [key, validateStudentField(key, form[key])]).filter(([, message]) => message));
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      const parentPayload = addParentContact ? { parent_name: form.parent_name.trim(), parent_email: form.parent_email.trim(), parent_phone: form.parent_phone.trim(), parent_address: form.parent_address.trim() } : { parent_name: null, parent_email: null, parent_phone: null, parent_address: null };
      const response = await authenticatedRequest(API_CONFIG.UPDATE_STUDENT, {
        method: "POST",
        body: { uuid: selected.id, name: form.name.trim(), nis: form.nis.trim(), nisn: form.nisn.trim(), phone: form.phone.trim(), email: form.email.trim(), class_uuid: form.class_uuid, address: form.address.trim(), gender_uuid: form.gender_uuid, ...parentPayload },
      });
      const responseData = response.data || {};
      const responseStatus = String(responseData.status ?? responseData.Status ?? "").toLowerCase();
      const pendingApproval = responseStatus === "pending" || Boolean(responseData.approval_uuid ?? responseData.approvalUUID ?? responseData.is_pending);
      setSelected(null);
      setEditing(false);
      setPage(1);
      setStatus(pendingApproval ? "Menunggu" : "Semua");
      setNoticeTone(pendingApproval ? "pending" : responseStatus === "active" ? "success" : "info");
      setSuccessMessage(pendingApproval ? `Perubahan siswa ${form.name.trim()} berhasil diajukan dan sedang menunggu persetujuan.` : responseStatus ? `Data siswa ${form.name.trim()} berhasil diperbarui.` : `Perubahan siswa ${form.name.trim()} berhasil dikirim. Status terbaru dimuat dari server.`);
      setRefreshKey(value => value + 1);
      window.setTimeout(() => setSuccessMessage(""), 5000);
    } catch (requestError) {
      setEditError(requestError.message);
    } finally {
      setEditSubmitting(false);
    }
  };
  const openDelete = student => { setDeleteError(""); setDeleting(student); };
  const confirmDelete = async () => {
    if (!deleting || deleteSubmitting) return;
    setDeleteSubmitting(true);
    setDeleteError("");
    try {
      const response = await authenticatedRequest(API_CONFIG.DELETE_STUDENT, { method: "DELETE", body: { uuid: deleting.id } });
      const responseData = response.data || {};
      const responseStatus = String(responseData.status ?? responseData.Status ?? "").toLowerCase();
      const pendingApproval = responseStatus === "pending" || Boolean(responseData.approval_uuid ?? responseData.approvalUUID ?? responseData.is_pending);
      const deletedName = deleting.name;
      setDeleting(null);
      setSelected(null);
      setPage(1);
      setStatus(pendingApproval ? "Menunggu" : "Semua");
      setNoticeTone(pendingApproval ? "pending" : responseStatus && responseStatus !== "active" ? "success" : "info");
      setSuccessMessage(pendingApproval ? `Penghapusan siswa ${deletedName} berhasil diajukan dan sedang menunggu persetujuan.` : responseStatus ? `Siswa ${deletedName} berhasil dihapus.` : `Permintaan penghapusan siswa ${deletedName} berhasil dikirim. Status terbaru dimuat dari server.`);
      setRefreshKey(value => value + 1);
      window.setTimeout(() => setSuccessMessage(""), 5000);
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };
  const confirmActivate = () => {
    setActivating(null);
    setRefreshKey(value => value + 1);
  };

  return <>
    <Helmet><title>Siswa — Gakuren</title></Helmet>
    <div className="p-4 sm:p-6">
      {successMessage && <div role="status" className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${noticeTone === "pending" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : noticeTone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"}`}>{noticeTone === "pending" ? <Clock3 className="h-5 w-5 shrink-0" /> : noticeTone === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <Info className="h-5 w-5 shrink-0" />}{successMessage}</div>}
      <section className="data-table-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between lg:p-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
            <button title="Muat ulang" disabled={loading} onClick={() => setRefreshKey(value => value + 1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
            <label className="relative min-w-0 flex-1 lg:max-w-56"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Cari data" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />{query && <button aria-label="Hapus pencarian" onClick={() => { setQuery(""); setPage(1); }} className="absolute right-1.5 top-1.5 rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</label>
            <Select value={status} onChange={value => { setStatus(value); setPage(1); }} ariaLabel="Filter status" className="w-36 shrink-0 sm:w-40" options={[{ value: "Semua", label: "Semua Status" }, "Aktif", "Nonaktif", "Menunggu"]} />
          </div>
          <div className="flex w-full justify-end gap-2 md:w-auto">
            {access.canCreate && <button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 shadow-sm"><Download className="h-4 w-4" /><span className="hidden xl:inline">Import</span></button>}
            <button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 shadow-sm"><Upload className="h-4 w-4" /><span className="hidden xl:inline">Export</span></button>
            {access.canCreate && <button onClick={openCreate} className="action-lift inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 md:flex-none"><Plus className="h-4 w-4" />Tambah Siswa</button>}
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1050px] table-fixed text-left text-xs">
            <thead className="bg-slate-100/80"><tr>{columns.map(([label, key]) => <th key={key} className="px-3 py-3 font-medium"><button onClick={() => changeSort(key)} className={`group flex items-center gap-1 hover:text-blue-600 ${sort.key === key ? "font-semibold text-blue-600" : ""}`}><span>{label}</span>{sort.key === key ? sort.direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowDownUp className="h-3 w-3 opacity-0 group-hover:opacity-60" />}</button></th>)}<th className="w-28 px-3 py-3 font-medium">Aksi</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id} tabIndex={0} onClick={() => openDetail(row)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) openDetail(row); }} className="cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/50 focus:bg-blue-50 focus:outline-none">
              <td className="px-3 py-3 font-semibold">{row.name}</td><td className="truncate px-3 py-3" title={row.nis}>{row.nis}</td><td className="truncate px-3 py-3" title={row.nisn}>{row.nisn}</td><td className="px-3 py-3">{row.class_name}</td><td className="px-3 py-3">{row.phone}</td><td className="px-3 py-3">{row.gender}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td>
              <td className="px-3 py-3"><div className="flex gap-2"><StatusRowActions item={row} label="siswa" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={openDelete} onActivate={setActivating} /></div></td>
            </tr>)}</tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">{rows.map(row => <article key={row.id} onClick={() => openDetail(row)} className="cursor-pointer p-4 text-left transition hover:bg-blue-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-slate-500">NIS {row.nis} • NISN {row.nisn}</p><p className="mt-1 text-xs text-slate-500">{row.class_name} • {row.phone} • {row.gender}</p></div><div className="flex w-24 shrink-0 flex-col items-stretch gap-3"><StatusBadge status={row.status} className="w-full" /><div className="grid grid-cols-2 justify-items-center gap-2 [&>button:only-child]:col-span-2"><StatusRowActions item={row} label="siswa" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={openDelete} onActivate={setActivating} /></div></div></div></article>)}</div>

        {error && <div className="grid place-items-center px-4 py-16 text-center text-rose-600"><p className="font-semibold">Gagal memuat data siswa</p><p className="mt-1 text-xs">{error}</p><button disabled={loading} onClick={() => { setLoading(true); setRefreshKey(value => value + 1); }} className="mt-4 inline-flex min-w-24 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold disabled:cursor-wait disabled:opacity-70">{loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}{loading ? "Memuat..." : "Coba lagi"}</button></div>}
        {loading && !rows.length && !error && <div className="grid place-items-center px-4 py-16 text-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-slate-500">Memuat data siswa...</p></div>}
        {!loading && !error && !rows.length && <div className="grid place-items-center px-4 py-16 text-center"><Search className="h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">Tidak ada siswa ditemukan</p></div>}

        <footer className="grid min-h-[76px] gap-4 border-t border-slate-200 bg-slate-50/50 px-5 py-4 text-xs text-slate-500 sm:grid-cols-3 sm:items-center"><span>Menampilkan <b className="text-slate-700">{statistics.total_row ? `${statistics.start_row}-${statistics.end_row}` : "0"}</b> dari {statistics.total_row} data</span><div className="flex items-center justify-center gap-1.5"><button disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>{Array.from({ length: Math.min(statistics.max_page || 1, 5) }, (_, index) => index + 1).map(number => <button key={number} disabled={loading} onClick={() => setPage(number)} className={`h-9 w-9 rounded-lg font-semibold ${page === number ? "bg-blue-600 text-white" : "border border-slate-200 bg-white"}`}>{number}</button>)}<button disabled={page >= (statistics.max_page || 1) || loading} onClick={() => setPage(value => value + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div><div className="flex justify-end"><Select value={pageSize} onChange={value => { setPageSize(Number(value)); setPage(1); }} ariaLabel="Jumlah data per halaman" placement="top" className="w-36 sm:w-40" options={[{ value: 5, label: "5 / Halaman" }, { value: 10, label: "10 / Halaman" }, { value: 25, label: "25 / Halaman" }, { value: 50, label: "50 / Halaman" }]} /></div></footer>
      </section>
    </div>
    <FormDrawer open={creating} title="Tambah Siswa" submitLabel={createSubmitting ? "Menyimpan..." : "Simpan Siswa"} submitting={createSubmitting} noValidate onClose={() => { if (!createSubmitting) setCreating(false); }} onSubmit={saveStudent}>
      <div className="space-y-5">
        {createError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{createError}</div>}
        {[["Nama Siswa", "name", "text", "Contoh: Ahmad Fauzi"], ["NIS", "nis", "text", "Masukkan nomor induk siswa"], ["NISN", "nisn", "text", "Masukkan 10 digit NISN"]].map(([label, key, type, placeholder]) => <ValidatedInput key={key} label={label} name={key} type={type} value={form[key]} placeholder={placeholder} error={formErrors[key]} onChange={event => updateCreateField(key, event.target.value)} onBlur={() => validateCreateField(key)} />)}
        <ClassPicker value={form.class_uuid} selectedName={form.class_name} error={formErrors.class_uuid} onChange={(uuid, name) => { setForm(current => ({ ...current, class_uuid: uuid, class_name: name })); if (formErrors.class_uuid) setFormErrors(current => ({ ...current, class_uuid: validateStudentField("class_uuid", uuid) })); }} onBlur={() => validateCreateField("class_uuid")} />
        {[["Email Siswa", "email", "email", "Contoh: siswa@sekolah.sch.id"], ["No. HP / WhatsApp", "phone", "tel", "Contoh: 081234567890"], ["Alamat Siswa", "address", "text", "Contoh: Jl. Merdeka No. 10, Jakarta"]].map(([label, key, type, placeholder]) => <ValidatedInput key={key} label={label} name={key} type={type} value={form[key]} placeholder={placeholder} error={formErrors[key]} onChange={event => updateCreateField(key, event.target.value)} onBlur={() => validateCreateField(key)} />)}
        <GenderSelect value={form.gender_uuid} selectedName={form.gender} error={formErrors.gender_uuid} onChange={(uuid, label) => { setForm(current => ({ ...current, gender_uuid: uuid, gender: label })); if (formErrors.gender_uuid) setFormErrors(current => ({ ...current, gender_uuid: validateStudentField("gender_uuid", uuid) })); }} />
        <div className="border-t border-slate-200 pt-5">
          <label className="checkbox-label group flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold transition">
            <input
              type="checkbox"
              checked={addParentContact}
              onChange={event => {
                const checked = event.target.checked;
                setAddParentContact(checked);
                setSameParentAddress(true);
                if (checked) setForm(current => ({ ...current, parent_address: current.address }));
                if (!checked) {
                  setForm(current => ({ ...current, parent_name: "", parent_email: "", parent_phone: "", parent_address: "" }));
                  setFormErrors(current => ({ ...current, parent_name: "", parent_email: "", parent_phone: "", parent_address: "" }));
                }
              }}
              className="peer sr-only"
            />
            <span className="remember-box" aria-hidden="true" />
            <span className="transition-transform duration-200 group-active:translate-x-0.5">Tambahkan kontak orang tua/wali</span>
          </label>
          <div
            aria-hidden={!addParentContact}
            className={`overflow-hidden transition-[max-height,margin,opacity,transform] duration-300 ease-out ${addParentContact ? "mt-5 max-h-[44rem] translate-y-0 opacity-100" : "pointer-events-none mt-0 max-h-0 -translate-y-6 opacity-0"}`}
          >
            <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
              <ValidatedInput label="Nama Orang Tua/Wali" name="parent_name" value={form.parent_name} placeholder="Contoh: Budi Santoso" error={formErrors.parent_name} onChange={event => updateCreateField("parent_name", event.target.value)} onBlur={() => validateCreateField("parent_name")} />
              <ValidatedInput label="Email Orang Tua/Wali" name="parent_email" type="email" value={form.parent_email} placeholder="Contoh: orangtua@email.com" error={formErrors.parent_email} onChange={event => updateCreateField("parent_email", event.target.value)} onBlur={() => validateCreateField("parent_email")} />
              <ValidatedInput label="No. WhatsApp Orang Tua/Wali" name="parent_phone" type="tel" value={form.parent_phone} placeholder="Contoh: 081234567890" error={formErrors.parent_phone} onChange={event => updateCreateField("parent_phone", event.target.value)} onBlur={() => validateCreateField("parent_phone")} />
              <div className="space-y-3">
                <label className="checkbox-label group flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold transition">
                  <input
                    type="checkbox"
                    checked={sameParentAddress}
                    onChange={event => {
                      const checked = event.target.checked;
                      setSameParentAddress(checked);
                      setForm(current => ({ ...current, parent_address: checked ? current.address : "" }));
                      setFormErrors(current => ({ ...current, parent_address: checked ? validateStudentField("parent_address", form.address) : "" }));
                    }}
                    className="peer sr-only"
                  />
                  <span className="remember-box" aria-hidden="true" />
                  <span className="transition-transform duration-200 group-active:translate-x-0.5">Alamat sama dengan siswa</span>
                </label>
                <ValidatedInput label="Alamat Orang Tua/Wali" name="parent_address" value={form.parent_address} placeholder="Contoh: Jl. Merdeka No. 10, Jakarta" error={formErrors.parent_address} disabled={sameParentAddress} onChange={event => updateCreateField("parent_address", event.target.value)} onBlur={() => validateCreateField("parent_address")} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormDrawer>
    <FormDrawer
      open={selected !== null}
      title={editing ? "Edit Siswa" : "Detail Siswa"}
      noValidate={editing}
      submitting={editSubmitting}
      onClose={() => { if (!editSubmitting) { setSelected(null); setEditing(false); } }}
      onSubmit={saveEdit}
      footerActions={editing ? <><button type="button" disabled={editSubmitting} onClick={() => { setForm({ ...selected }); setEditError(""); setEditing(false); }} className="action-lift rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Batal</button><button type="submit" disabled={editSubmitting} className="action-lift rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70">{editSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</button></> : <><button type="button" onClick={() => setSelected(null)} className="action-lift rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Tutup</button>{selected?.status === "Nonaktif" ? access.canUpdate && <button type="button" onClick={() => { setActivating(selected); setSelected(null); }} className="action-lift inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" />Aktifkan</button> : <>{access.canDelete && <button type="button" disabled={selected?.status !== "Aktif"} title={selected?.status !== "Aktif" ? "Aksi hanya tersedia untuk siswa aktif" : "Hapus siswa"} onClick={() => setDeleting(selected)} className="action-lift inline-flex items-center gap-2 rounded-lg border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"><Trash2 className="h-4 w-4" />Hapus</button>}{access.canUpdate && <button type="button" disabled={selected?.status !== "Aktif"} title={selected?.status !== "Aktif" ? "Aksi hanya tersedia untuk siswa aktif" : "Edit siswa"} onClick={() => { setEditError(""); setEditing(true); }} className="action-lift inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><Pencil className="h-4 w-4" />Edit</button>}</>}</>}
    >
      <div className="space-y-5">
        {editing && editError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{editError}</div>}
        {[["Nama Siswa", "name", "text"], ["NIS", "nis", "text"], ["NISN", "nisn", "text"]].map(([label, key, type]) => editing ? <ValidatedInput key={key} label={label} name={key} type={type} value={form[key]} error={formErrors[key]} onChange={event => updateCreateField(key, event.target.value)} onBlur={() => validateCreateField(key)} /> : <label key={key} className="block text-sm"><span className="mb-2 block font-semibold">{label}</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-700">{form[key] || "-"}</div></label>)}
        {editing ? <ClassPicker value={form.class_uuid} selectedName={form.class_name} error={formErrors.class_uuid} onChange={(uuid, name) => { setForm(current => ({ ...current, class_uuid: uuid, class_name: name })); if (formErrors.class_uuid) setFormErrors(current => ({ ...current, class_uuid: validateStudentField("class_uuid", uuid) })); }} onBlur={() => validateCreateField("class_uuid")} /> : <label className="block text-sm"><span className="mb-2 block font-semibold">Kelas</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-700">{form.class_name || "-"}</div></label>}
        {[["Email Siswa", "email", "email"], ["No. HP / WhatsApp", "phone", "tel"], ["Alamat Siswa", "address", "text"]].map(([label, key, type]) => editing ? <ValidatedInput key={key} label={label} name={key} type={type} value={form[key]} error={formErrors[key]} onChange={event => updateCreateField(key, event.target.value)} onBlur={() => validateCreateField(key)} /> : <label key={key} className="block text-sm"><span className="mb-2 block font-semibold">{label}</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-700">{form[key] || "-"}</div></label>)}
        {editing ? <GenderSelect value={form.gender_uuid} selectedName={form.gender} error={formErrors.gender_uuid} onChange={(uuid, label) => { setForm(current => ({ ...current, gender_uuid: uuid, gender: label })); if (formErrors.gender_uuid) setFormErrors(current => ({ ...current, gender_uuid: validateStudentField("gender_uuid", uuid) })); }} /> : <label className="block text-sm"><span className="mb-2 block font-semibold">Jenis Kelamin</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-700">{form.gender || "-"}</div></label>}
        {editing && <section className="border-t border-slate-200 pt-5">
          <label className="checkbox-label group flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold transition">
            <input type="checkbox" checked={addParentContact} onChange={event => {
              const checked = event.target.checked;
              setAddParentContact(checked);
              setSameParentAddress(true);
              if (checked) setForm(current => ({ ...current, parent_address: current.address }));
              else {
                setForm(current => ({ ...current, parent_name: "", parent_email: "", parent_phone: "", parent_address: "" }));
                setFormErrors(current => ({ ...current, parent_name: "", parent_email: "", parent_phone: "", parent_address: "" }));
              }
            }} className="peer sr-only" />
            <span className="remember-box" aria-hidden="true" />
            <span className="transition-transform duration-200 group-active:translate-x-0.5">Tambahkan kontak orang tua/wali</span>
          </label>
          <div aria-hidden={!addParentContact} className={`overflow-hidden transition-[max-height,margin,opacity,transform] duration-300 ease-out ${addParentContact ? "mt-5 max-h-[44rem] translate-y-0 opacity-100" : "pointer-events-none mt-0 max-h-0 -translate-y-6 opacity-0"}`}>
            <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
              <ValidatedInput label="Nama Orang Tua/Wali" name="parent_name" value={form.parent_name} placeholder="Contoh: Budi Santoso" error={formErrors.parent_name} onChange={event => updateCreateField("parent_name", event.target.value)} onBlur={() => validateCreateField("parent_name")} />
              <ValidatedInput label="Email Orang Tua/Wali" name="parent_email" type="email" value={form.parent_email} placeholder="Contoh: orangtua@email.com" error={formErrors.parent_email} onChange={event => updateCreateField("parent_email", event.target.value)} onBlur={() => validateCreateField("parent_email")} />
              <ValidatedInput label="No. WhatsApp Orang Tua/Wali" name="parent_phone" type="tel" value={form.parent_phone} placeholder="Contoh: 081234567890" error={formErrors.parent_phone} onChange={event => updateCreateField("parent_phone", event.target.value)} onBlur={() => validateCreateField("parent_phone")} />
              <div className="space-y-3">
                <label className="checkbox-label group flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold transition">
                  <input type="checkbox" checked={sameParentAddress} onChange={event => { const checked = event.target.checked; setSameParentAddress(checked); setForm(current => ({ ...current, parent_address: checked ? current.address : "" })); setFormErrors(current => ({ ...current, parent_address: checked ? validateStudentField("parent_address", form.address) : "" })); }} className="peer sr-only" />
                  <span className="remember-box" aria-hidden="true" />
                  <span className="transition-transform duration-200 group-active:translate-x-0.5">Alamat sama dengan siswa</span>
                </label>
                <ValidatedInput label="Alamat Orang Tua/Wali" name="parent_address" value={form.parent_address} placeholder="Contoh: Jl. Merdeka No. 10, Jakarta" error={formErrors.parent_address} disabled={sameParentAddress} onChange={event => updateCreateField("parent_address", event.target.value)} onBlur={() => validateCreateField("parent_address")} />
              </div>
            </div>
          </div>
        </section>}
        {!editing && <section className="border-t border-slate-200 pt-5">
          <h3 className="mb-5 font-bold text-slate-800 dark:text-slate-100">Data Orang Tua/Wali</h3>
          <div className="space-y-5">
            {[["Nama Orang Tua/Wali", "parent_name"], ["Email Orang Tua/Wali", "parent_email"], ["No. WhatsApp Orang Tua/Wali", "parent_phone"], ["Alamat Orang Tua/Wali", "parent_address"]].map(([label, key]) => <div key={key} className="text-sm"><span className="mb-2 block font-semibold">{label}</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-700">{form[key] || "-"}</div></div>)}
          </div>
        </section>}
        {!editing && <div className="text-sm"><span className="mb-2 block font-semibold">Status</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3"><StatusBadge status={form.status} /></div></div>}
      </div>
    </FormDrawer>
    <ConfirmDialog open={activating !== null} title="Aktifkan siswa?" description={activating ? `Siswa ${activating.name} akan diaktifkan.` : ""} confirmLabel="Aktifkan Siswa" tone="success" onConfirm={confirmActivate} onCancel={() => setActivating(null)} />
    <ConfirmDialog open={deleting !== null} title="Hapus siswa?" description={deleteError || (deleting ? `Siswa ${deleting.name} akan dihapus. Tindakan ini tidak dapat dibatalkan.` : "")} confirmLabel={deleteSubmitting ? "Menghapus..." : "Hapus Siswa"} onConfirm={confirmDelete} onCancel={() => { if (!deleteSubmitting) { setDeleting(null); setDeleteError(""); } }} />
  </>;
}
