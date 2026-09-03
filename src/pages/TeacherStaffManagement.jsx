import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowDownUp, ArrowLeft, ArrowUp, Check, ChevronLeft, ChevronRight, Download, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import ConfirmDialog from "../components/ConfirmDialog";
import DatePicker from "../components/DatePicker";
import EducationLevelSelect from "../components/EducationLevelSelect";
import FormDrawer from "../components/FormDrawer";
import GenderSelect from "../components/GenderSelect";
import Select from "../components/Select";
import StatusBadge from "../components/StatusBadge";
import StatusRowActions from "../components/StatusRowActions";
import TitleSelector from "../components/TitleSelector";
import UnsavedChangesDialog from "../components/UnsavedChangesDialog";
import API_CONFIG from "../config/api";
import { authenticatedRequest } from "../utils/api";
import { getCrudPermissions } from "../utils/permissions";
import { formatIndonesianAcademicName } from "../utils/titleOptions";

const columns = [["Nama", "name"], ["NIP", "nip"], ["Email", "email"], ["No. HP / WhatsApp", "phone"], ["Jabatan", "position"], ["Status", "status"]];
const statuses = { Aktif: "active", Nonaktif: "inactive", Menunggu: "pending" };
const statusLabels = { active: "Aktif", inactive: "Nonaktif", pending: "Pending" };
const newEducation = (isLast = false) => ({ id: globalThis.crypto?.randomUUID?.() || `education-${Date.now()}-${Math.random()}`, education_level_uuid: "", education_level_code: "", education_level_name: "", education_level_order: 0, institution: "", major: "", enrollment_year: "", graduation_year: "", is_last_education: isLast });
const createEmptyForm = () => ({ name: "", nip: "", email: "", phone: "", position: "", status: "Aktif", gender_uuid: "", gender: "", birth_place: "", birth_date: "", address: "", educations: [newEducation(true)], role: "", subject: "", department: "", employment_status: "", title_prefix_uuids: [], title_suffix_uuids: [], title_prefixes: [], title_suffixes: [] });
const textFields = [["Nama", "name", "text", "Contoh: Ahmad Fauzi, S.Pd"], ["NIP", "nip", "text", "Masukkan NIP"], ["Email", "email", "email", "Contoh: nama@sekolah.sch.id"], ["No. HP / WhatsApp", "phone", "tel", "Contoh: 081234567890"], ["Jabatan", "position", "text", "Contoh: Guru Matematika"]];
const wizardSteps = ["Biodata", "Pendidikan", "Jenis Pegawai", "Detail Pekerjaan"];
const minimumBirthDate = (() => { const date = new Date(); date.setFullYear(date.getFullYear() - 17); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; })();
const wizardFields = {
  1: ["name", "email", "phone", "gender_uuid", "birth_place", "birth_date", "address"],
  2: ["educations"],
  3: ["role"],
  4: ["nip", "position", "employment_status"],
};

const validateTeacherField = (key, value) => {
  const input = String(value || "").trim();
  if (!input) return "Field ini wajib diisi.";
  if (key === "name" && (!/^[\p{L}\s.,'-]+$/u.test(input) || input.length < 2 || input.length > 100)) return "Nama harus 2–100 karakter dan hanya boleh berisi huruf serta tanda baca nama.";
  if (key === "nip" && !/^\d{8,30}$/.test(input)) return "NIP harus terdiri dari 8–30 digit tanpa spasi atau karakter khusus.";
  if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input)) return "Masukkan alamat email yang valid.";
  if (key === "phone" && !/^(?:\+62|62|0)8\d{7,12}$/.test(input)) return "Gunakan nomor Indonesia yang valid, misalnya 081234567890.";
  if (key === "position" && (!/^[\p{L}\d\s./&()-]+$/u.test(input) || input.length > 100)) return "Jabatan hanya boleh berisi huruf, angka, spasi, dan tanda baca umum.";
  return "";
};

const validateWizardField = (key, value) => {
  const input = String(value || "").trim();
  if (!input) return "Field ini wajib diisi.";
  if (["name", "email", "phone", "nip", "position"].includes(key)) return validateTeacherField(key, input);
  if (key === "birth_date" && input > minimumBirthDate) return "Guru atau staf harus berusia minimal 17 tahun.";
  if (["enrollment_year", "graduation_year"].includes(key) && (!/^\d{4}$/.test(input) || Number(input) > new Date().getFullYear())) return `Masukkan ${key === "enrollment_year" ? "tahun masuk" : "tahun lulus"} yang valid.`;
  return "";
};

const educationErrorKey = (id, field) => `education-${id}-${field}`;
const educationFields = ["education_level_uuid", "institution", "major", "enrollment_year", "graduation_year"];
const requiredEducationFields = education => ["education_level_uuid", "institution", "enrollment_year", "graduation_year", ...(education.education_level_order >= 3 ? ["major"] : [])];
const validateEducation = (education, key) => {
  if (key === "major" && education.education_level_order < 3) return "";
  const message = validateWizardField(key, education[key]);
  if (!message && key === "graduation_year" && education.enrollment_year && Number(education[key]) < Number(education.enrollment_year)) return "Tahun lulus tidak boleh sebelum tahun masuk.";
  return message;
};
const hasMeaningfulFormData = form => Object.entries(form).some(([key, value]) => {
  if (["status", "title_prefixes", "title_suffixes"].includes(key)) return false;
  if (key === "educations") return value.some(education => educationFields.some(field => String(education[field] || "").trim()));
  return Array.isArray(value) ? value.length > 0 : String(value || "").trim() !== "";
});

export default function TeacherStaffManagement() {
  const access = getCrudPermissions("teacherandstaff");
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
  const [form, setForm] = useState(createEmptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [createStep, setCreateStep] = useState(1);
  const [closePrompt, setClosePrompt] = useState(false);
  const [closeIntent, setCloseIntent] = useState("close");
  const createGuardActive = useRef(false);
  const ignoreNextPop = useRef(false);

  const hasCreateData = hasMeaningfulFormData(form);
  const hasEditChanges = editing && selected && JSON.stringify(form) !== JSON.stringify(selected);

  useEffect(() => {
    if (!creating || createGuardActive.current) return undefined;
    window.history.pushState({ gakurenCreateGuard: true }, "", window.location.href);
    createGuardActive.current = true;
    const handlePopState = () => {
      if (ignoreNextPop.current) { ignoreNextPop.current = false; return; }
      createGuardActive.current = false;
      const dirty = hasMeaningfulFormData(form);
      if (!dirty) { setCreating(false); return; }
      window.history.pushState({ gakurenCreateGuard: true }, "", window.location.href);
      createGuardActive.current = true;
      setCloseIntent("back");
      setClosePrompt(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [creating, form]);

  useEffect(() => {
    if ((!creating || !hasCreateData) && !hasEditChanges) return undefined;
    const warnBeforeUnload = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [creating, hasCreateData, hasEditChanges]);

  useEffect(() => {
    if (!access.canView) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await authenticatedRequest(API_CONFIG.GET_TEACHER_STAFF, { method: "POST", signal: controller.signal, body: { search: query.trim() || null, filter: status === "Semua" ? null : { status: statuses[status] }, page, row_per_page: pageSize, sort_by: [{ [sort.key]: sort.direction }] } });
        const payload = response.data || {};
        setError("");
        setRows((payload.result || []).map(item => ({ id: item.UUID ?? item.uuid, name: item.Name ?? item.name ?? "-", nip: item.NIP ?? item.Nip ?? item.nip ?? "-", email: item.Email ?? item.email ?? "-", phone: item.Phone ?? item.PhoneNumber ?? item.phone ?? "-", position: item.Position ?? item.Role ?? item.position ?? "-", role: String(item.EmployeeType ?? item.employee_type ?? item.Type ?? item.type ?? "").toLowerCase(), title_prefix_uuids: item.TitlePrefixUUIDs ?? item.title_prefix_uuids ?? [], title_suffix_uuids: item.TitleSuffixUUIDs ?? item.title_suffix_uuids ?? [], title_prefixes: item.TitlePrefixes ?? item.title_prefixes ?? [], title_suffixes: item.TitleSuffixes ?? item.title_suffixes ?? [], status: statusLabels[String(item.Status ?? item.status).toLowerCase()] || item.Status || item.status || "-" })));
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
  const openDetail = item => { setFormErrors({}); setForm({ ...item }); setSelected(item); setEditing(false); };
  const openEdit = item => { setFormErrors({}); setForm({ ...item }); setSelected(item); setEditing(true); };
  const validateCreateStep = step => {
    if (step === 2) {
      const errors = {};
      form.educations.forEach(education => requiredEducationFields(education).forEach(key => {
        const message = validateEducation(education, key);
        if (message) errors[educationErrorKey(education.id, key)] = message;
      }));
      setFormErrors(current => ({ ...current, ...errors }));
      return Object.keys(errors).length === 0;
    }
    const fields = [...wizardFields[step], ...(step === 4 ? [form.role === "teacher" ? "subject" : "department"] : [])];
    const errors = Object.fromEntries(fields.map(key => [key, validateWizardField(key, form[key])]).filter(([, message]) => message));
    setFormErrors(current => ({ ...current, ...Object.fromEntries(fields.map(key => [key, ""])), ...errors }));
    return Object.keys(errors).length === 0;
  };
  const releaseCreateGuard = navigateBack => {
    if (!createGuardActive.current) return;
    createGuardActive.current = false;
    ignoreNextPop.current = true;
    window.history.go(navigateBack ? -2 : -1);
    window.setTimeout(() => { ignoreNextPop.current = false; }, 500);
  };
  const closeCreate = (navigateBack = false) => { setClosePrompt(false); setCreating(false); releaseCreateGuard(navigateBack); };
  const requestCreateClose = () => {
    if (!hasCreateData) { closeCreate(false); return; }
    setCloseIntent("close");
    setClosePrompt(true);
  };
  const requestEditClose = () => {
    if (!hasEditChanges) { setSelected(null); setEditing(false); return; }
    setCloseIntent("edit");
    setClosePrompt(true);
  };
  const addCreatedRow = () => {
    const roleLabel = form.role === "teacher" ? "Guru" : "Staf";
    const suggestedPosition = form.role === "teacher" && form.subject ? `Guru ${form.subject}` : form.department;
    const created = { ...form, position: form.position.trim() || suggestedPosition, status: "Aktif", roleLabel, id: `local-${Date.now()}` };
    setRows(current => [created, ...current]);
    setStatistics(current => ({ ...current, total_row: current.total_row + 1, end_row: current.end_row + 1 }));
    closeCreate(false);
  };
  const saveCreate = event => {
    event.preventDefault();
    if (createStep < 4) { if (validateCreateStep(createStep)) setCreateStep(step => step + 1); return; }
    const allErrors = {};
    [1, 3, 4].forEach(step => [...wizardFields[step], ...(step === 4 ? [form.role === "teacher" ? "subject" : "department"] : [])].forEach(key => {
      const message = validateWizardField(key, form[key]);
      if (message) allErrors[key] = message;
    }));
    form.educations.forEach(education => requiredEducationFields(education).forEach(key => {
      const message = validateEducation(education, key);
      if (message) allErrors[educationErrorKey(education.id, key)] = message;
    }));
    setFormErrors(allErrors);
    if (Object.keys(allErrors).length) {
      const firstInvalidStep = Object.keys(allErrors).some(key => key.startsWith("education-")) ? 2 : [1, 3, 4].find(step => [...wizardFields[step], ...(step === 4 ? [form.role === "teacher" ? "subject" : "department"] : [])].some(key => allErrors[key]));
      setCreateStep(firstInvalidStep || 1);
      return;
    }
    addCreatedRow();
  };
  const saveEdit = event => { event.preventDefault(); if (!editing) return; const errors = Object.fromEntries(textFields.map(([, key]) => [key, validateTeacherField(key, form[key])]).filter(([, message]) => message)); setFormErrors(errors); if (Object.keys(errors).length) return; setRows(current => current.map(item => item.id === selected.id ? { ...item, ...form } : item)); setSelected(current => ({ ...current, ...form })); setEditing(false); };
  const confirmDelete = () => { setRows(current => current.filter(item => item.id !== deleting.id)); setStatistics(current => ({ ...current, total_row: Math.max(0, current.total_row - 1), end_row: Math.max(0, current.end_row - 1) })); setDeleting(null); setSelected(null); };
  const confirmActivate = () => { setActivating(null); setRefreshKey(value => value + 1); };

  const updateTitles = (type, uuids, labels) => setForm(current => ({ ...current, [type === "prefix" ? "title_prefix_uuids" : "title_suffix_uuids"]: uuids, [type === "prefix" ? "title_prefixes" : "title_suffixes"]: labels }));
  const formContent = (editable, validate = false) => <div className="space-y-5">{textFields.map(([label, key, type, placeholder]) => { const fieldError = validate ? formErrors[key] : ""; return <label key={key} className="block text-sm"><span className="mb-2 block font-semibold">{label}{editable && <b className="text-rose-500"> *</b>}</span>{editable ? <><input type={type} inputMode={type === "tel" || key === "nip" ? "numeric" : undefined} value={form[key]} placeholder={placeholder} aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? `${key}-error` : undefined} onChange={event => { const value = event.target.value; setForm(current => ({ ...current, [key]: value })); if (validate && formErrors[key]) setFormErrors(current => ({ ...current, [key]: validateTeacherField(key, value) })); }} onBlur={() => validate && setFormErrors(current => ({ ...current, [key]: validateTeacherField(key, form[key]) }))} className={`w-full rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${fieldError ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />{fieldError && <span id={`${key}-error`} role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{fieldError}</span>}</> : <div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">{form[key] || "-"}</div>}</label>; })}{editable && <TitleSelector previewName={form.name} prefixValues={form.title_prefix_uuids || []} suffixValues={form.title_suffix_uuids || []} onChange={updateTitles} />}{!editable && <><div className="text-sm"><span className="mb-2 block font-semibold">Nama dengan gelar</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">{formatIndonesianAcademicName(form.name, form.title_prefixes, form.title_suffixes) || "-"}</div></div><div className="text-sm"><span className="mb-2 block font-semibold">Status</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3"><StatusBadge status={form.status} /></div></div></>}</div>;

  const updateWizardField = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    if (formErrors[key]) setFormErrors(current => ({ ...current, [key]: validateWizardField(key, value) }));
  };
  const wizardInput = (label, key, options = {}) => <label className={`block text-sm ${options.full ? "sm:col-span-2" : ""}`}><span className="mb-2 block font-semibold">{label} <b className="text-rose-500">*</b></span>{options.textarea ? <textarea rows="3" value={form[key]} placeholder={options.placeholder} onChange={event => updateWizardField(key, event.target.value)} className={`w-full resize-none rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${formErrors[key] ? "border-rose-400 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} /> : <input type={options.type || "text"} inputMode={options.numeric ? "numeric" : undefined} value={form[key]} placeholder={options.placeholder} onChange={event => updateWizardField(key, event.target.value)} className={`w-full rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${formErrors[key] ? "border-rose-400 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />}{formErrors[key] && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{formErrors[key]}</span>}</label>;
  const wizardSelect = (label, key, options) => <label className="block text-sm"><span className="mb-2 block font-semibold">{label} <b className="text-rose-500">*</b></span><Select value={form[key]} onChange={value => updateWizardField(key, value)} ariaLabel={label} className="w-full" size="large" options={[{ value: "", label: `Pilih ${label.toLowerCase()}` }, ...options.map(option => ({ value: option, label: option }))]} />{formErrors[key] && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{formErrors[key]}</span>}</label>;
  const updateEducation = (id, key, value, level) => {
    setForm(current => ({ ...current, educations: current.educations.map(education => education.id === id ? { ...education, [key]: value, ...(level ? { education_level_code: level.code, education_level_name: level.name, education_level_order: level.levelOrder } : {}) } : education) }));
    const errorKey = educationErrorKey(id, key);
    if (formErrors[errorKey]) {
      const education = form.educations.find(item => item.id === id);
      setFormErrors(current => ({ ...current, [errorKey]: validateEducation({ ...education, [key]: value, ...(level ? { education_level_order: level.levelOrder } : {}) }, key) }));
    }
    if (level && level.levelOrder < 3) setFormErrors(current => ({ ...current, [educationErrorKey(id, "major")]: "" }));
  };
  const addEducation = () => setForm(current => ({ ...current, educations: [...current.educations, newEducation()] }));
  const setLastEducation = id => setForm(current => ({ ...current, educations: current.educations.map(education => ({ ...education, is_last_education: education.id === id })) }));
  const removeEducation = id => {
    setForm(current => {
      const removed = current.educations.find(education => education.id === id);
      const educations = current.educations.filter(education => education.id !== id);
      if (removed?.is_last_education && educations.length) educations[0] = { ...educations[0], is_last_education: true };
      return { ...current, educations };
    });
    setFormErrors(current => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`education-${id}-`))));
  };
  const educationInput = (education, label, key, options = {}) => {
    const errorKey = educationErrorKey(education.id, key);
    return <label className={`block text-sm ${options.full ? "sm:col-span-2" : ""}`}><span className="mb-2 block font-semibold text-slate-800 dark:text-slate-200">{label} {options.required === false ? <span className="font-normal text-slate-400">(opsional)</span> : <b className="text-rose-500">*</b>}</span><input type="text" inputMode={options.numeric ? "numeric" : undefined} value={education[key]} placeholder={options.placeholder} onChange={event => updateEducation(education.id, key, event.target.value)} className={`w-full rounded-lg border bg-white px-3.5 py-3 text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 ${formErrors[errorKey] ? "border-rose-400 focus:ring-rose-100 dark:border-rose-500/70 dark:focus:ring-rose-950/50" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100 dark:border-white/20 dark:focus:border-blue-400 dark:focus:ring-blue-950/40"}`} />{formErrors[errorKey] && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600 dark:text-rose-400">{formErrors[errorKey]}</span>}</label>;
  };
  const educationStep = <div className="space-y-5">{form.educations.map((education, index) => <section key={education.id} className={`rounded-xl border p-4 transition-colors ${education.is_last_education ? "border-blue-300 bg-blue-50/50 dark:border-blue-500/70 dark:bg-white/[0.055]" : "border-slate-200 bg-white dark:border-white/15 dark:bg-white/[0.025]"}`}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold text-slate-800 dark:text-slate-100">Pendidikan {index + 1}</h4><div className="flex items-center gap-2"><label className="group inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-white/5"><input type="radio" name="last-education" checked={education.is_last_education} onChange={() => setLastEducation(education.id)} className="peer sr-only" /><span className="grid h-4 w-4 place-items-center rounded-full border-2 border-slate-400 bg-white transition peer-checked:border-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300 dark:border-slate-500 dark:bg-transparent dark:peer-checked:border-blue-400"><span className="h-2 w-2 scale-0 rounded-full bg-blue-600 transition peer-checked:scale-100 dark:bg-blue-400" /></span><span>Pendidikan terakhir</span></label>{form.educations.length > 1 && <button type="button" onClick={() => removeEducation(education.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30" aria-label={`Hapus pendidikan ${index + 1}`}><Trash2 className="h-3.5 w-3.5" />Hapus</button>}</div></div><div className="grid gap-5 sm:grid-cols-2">{educationInput(education, "Institusi pendidikan", "institution", { full: true, placeholder: "Nama institusi" })}<EducationLevelSelect value={education.education_level_uuid} error={formErrors[educationErrorKey(education.id, "education_level_uuid")]} onChange={(value, level) => updateEducation(education.id, "education_level_uuid", value, level)} />{educationInput(education, "Jurusan", "major", { placeholder: "Contoh: Matematika", required: education.education_level_order >= 3 })}{educationInput(education, "Tahun masuk", "enrollment_year", { numeric: true, placeholder: "Contoh: 2017" })}{educationInput(education, "Tahun keluar", "graduation_year", { numeric: true, placeholder: "Contoh: 2020" })}</div></section>)}<button type="button" onClick={addEducation} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-500/60 dark:text-blue-400 dark:hover:bg-white/5"><Plus className="h-4 w-4" />Tambah pendidikan</button></div>;
  const createWizard = <div><ol className="mb-8 grid grid-cols-4 gap-1" aria-label="Tahapan formulir">{wizardSteps.map((label, index) => { const number = index + 1; const completed = number < createStep; return <li key={label} className="min-w-0"><button type="button" disabled={number > createStep} onClick={() => setCreateStep(number)} className="w-full text-center disabled:cursor-default"><span className={`mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${number === createStep ? "bg-blue-600 text-white" : completed ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950" : "bg-slate-100 text-slate-400"}`}>{completed ? <Check className="h-4 w-4" /> : number}</span><span className={`block truncate text-[11px] ${number === createStep ? "font-semibold text-blue-700" : "text-slate-500"}`}>{label}</span></button><div className={`mt-2 h-1 rounded-full ${completed ? "bg-emerald-600 dark:bg-emerald-500" : number === createStep ? "bg-blue-500" : "bg-slate-100"}`} /></li>; })}</ol>
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Langkah {createStep} dari 4</p><h3 className="mt-1 text-xl font-bold">{wizardSteps[createStep - 1]}</h3></div>
    {createStep === 1 && <div className="grid gap-5 sm:grid-cols-2">{wizardInput("Nama lengkap", "name", { full: true, placeholder: "Contoh: Ahmad Fauzi" })}<TitleSelector previewName={form.name} prefixValues={form.title_prefix_uuids} suffixValues={form.title_suffix_uuids} onChange={updateTitles} />{wizardInput("Email", "email", { type: "email", placeholder: "nama@sekolah.sch.id" })}{wizardInput("No. HP / WhatsApp", "phone", { numeric: true, placeholder: "081234567890" })}<GenderSelect value={form.gender_uuid} error={formErrors.gender_uuid} onChange={(uuid, label) => { setForm(current => ({ ...current, gender_uuid: uuid, gender: label })); if (formErrors.gender_uuid) setFormErrors(current => ({ ...current, gender_uuid: validateWizardField("gender_uuid", uuid) })); }} />{wizardInput("Tempat lahir", "birth_place", { placeholder: "Kota kelahiran" })}<DatePicker id="teacher-birth-date" label="Tanggal lahir" required value={form.birth_date} max={minimumBirthDate} error={formErrors.birth_date} onChange={value => updateWizardField("birth_date", value)} className="sm:col-span-2" />{wizardInput("Alamat", "address", { full: true, textarea: true, placeholder: "Alamat lengkap" })}</div>}
    {createStep === 2 && educationStep}
    {createStep === 3 && <div className="space-y-3"><p className="text-sm text-slate-500">Pilih jenis pegawai. Isian pada langkah terakhir akan disesuaikan dengan pilihan ini.</p>{[["teacher", "Guru", "Mengajar mata pelajaran dan menangani kegiatan akademik."], ["staff", "Staf", "Mendukung administrasi dan operasional sekolah."]].map(([value, label, description]) => <button key={value} type="button" onClick={() => updateWizardField("role", value)} className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${form.role === value ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${form.role === value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}>{form.role === value && <Check className="h-3.5 w-3.5" />}</span><span><b className="block">{label}</b><span className="mt-1 block text-xs text-slate-500">{description}</span></span></button>)}{formErrors.role && <p role="alert" className="text-xs font-medium text-rose-600">{formErrors.role}</p>}</div>}
    {createStep === 4 && <div className="grid gap-5 sm:grid-cols-2">{wizardInput("NIP", "nip", { numeric: true, placeholder: "Masukkan NIP" })}{wizardInput("Jabatan", "position", { placeholder: form.role === "teacher" ? "Contoh: Guru Kelas" : "Contoh: Staf Administrasi" })}{form.role === "teacher" ? wizardInput("Mata pelajaran", "subject", { placeholder: "Contoh: Matematika" }) : wizardInput("Bagian / departemen", "department", { placeholder: "Contoh: Tata Usaha" })}{wizardSelect("Status kepegawaian", "employment_status", ["Tetap", "Kontrak", "Honorer"])}</div>}
    {createStep > 1 && <button type="button" onClick={() => setCreateStep(step => step - 1)} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" />Kembali ke langkah sebelumnya</button>}
  </div>;

  return <><Helmet><title>Guru dan Staf — Gakuren</title></Helmet><div className="p-4 sm:p-6"><section className="data-table-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
    <div className="flex flex-col gap-3 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between lg:p-4"><div className="flex min-w-0 flex-1 items-center gap-2"><button title="Muat ulang" disabled={loading} onClick={() => setRefreshKey(value => value + 1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><label className="relative min-w-0 flex-1 lg:max-w-56"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Cari data" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500" />{query && <button aria-label="Hapus pencarian" onClick={() => { setQuery(""); setPage(1); }} className="absolute right-1.5 top-1.5 p-2 text-slate-400"><X className="h-4 w-4" /></button>}</label><Select value={status} onChange={value => { setStatus(value); setPage(1); }} ariaLabel="Filter status" className="w-36 shrink-0 sm:w-40" options={[{ value: "Semua", label: "Semua Status" }, "Aktif", "Nonaktif", "Pending"]} /></div><div className="flex w-full justify-end gap-2 md:w-auto">{access.canCreate && <button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"><Download className="h-4 w-4" /><span className="hidden xl:inline">Import</span></button>}<button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"><Upload className="h-4 w-4" /><span className="hidden xl:inline">Export</span></button>{access.canCreate && <button onClick={() => { setForm(createEmptyForm()); setFormErrors({}); setCreateStep(1); setCreating(true); }} className="action-lift inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white md:flex-none"><Plus className="h-4 w-4" />Tambah Guru/Staf</button>}</div></div>
    <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] table-fixed text-left text-xs"><thead className="bg-slate-100/80"><tr>{columns.map(([label, key]) => <th key={key} className="px-3 py-3 font-medium"><button onClick={() => changeSort(key)} className={`group flex items-center gap-1 hover:text-blue-600 ${sort.key === key ? "font-semibold text-blue-600" : ""}`}>{label}{sort.key === key ? sort.direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowDownUp className="h-3 w-3 opacity-0 group-hover:opacity-60" />}</button></th>)}<th className="w-28 px-3 py-3">Aksi</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} tabIndex={0} onClick={() => openDetail(row)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) openDetail(row); }} className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/50 focus:bg-blue-50 focus:outline-none"><td className="px-3 py-3 font-semibold">{row.name}</td><td className="px-3 py-3">{row.nip}</td><td className="truncate px-3 py-3" title={row.email}>{row.email}</td><td className="px-3 py-3">{row.phone}</td><td className="px-3 py-3">{row.position}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td><td className="px-3 py-3"><div className="flex gap-2"><StatusRowActions item={row} label="guru atau staf" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={setDeleting} onActivate={setActivating} /></div></td></tr>)}</tbody></table></div>
    <div className="divide-y divide-slate-100 md:hidden">{rows.map(row => <article key={row.id} onClick={() => openDetail(row)} className="cursor-pointer p-4 text-left hover:bg-blue-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-slate-500">NIP {row.nip} • {row.position}</p><p className="mt-1 truncate text-xs text-slate-500">{row.email}</p><p className="mt-1 text-xs text-slate-500">{row.phone}</p></div><div className="flex w-24 shrink-0 flex-col items-stretch gap-3"><StatusBadge status={row.status} className="w-full" /><div className="grid grid-cols-2 justify-items-center gap-2 [&>button:only-child]:col-span-2"><StatusRowActions item={row} label="guru atau staf" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={setDeleting} onActivate={setActivating} /></div></div></div></article>)}</div>
    {error && <div className="grid place-items-center px-4 py-16 text-center text-rose-600"><p className="font-semibold">Gagal memuat data guru dan staf</p><p className="mt-1 text-xs">{error}</p><button disabled={loading} onClick={() => { setLoading(true); setRefreshKey(value => value + 1); }} className="mt-4 inline-flex min-w-24 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold">{loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}{loading ? "Memuat..." : "Coba lagi"}</button></div>}{loading && !rows.length && !error && <div className="grid place-items-center px-4 py-16"><RefreshCw className="h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-slate-500">Memuat data...</p></div>}{!loading && !error && !rows.length && <div className="grid place-items-center px-4 py-16"><Search className="h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">Tidak ada data ditemukan</p></div>}
    <footer className="grid min-h-[76px] gap-4 border-t border-slate-200 bg-slate-50/50 px-5 py-4 text-xs text-slate-500 sm:grid-cols-3 sm:items-center"><span>Menampilkan <b>{statistics.total_row ? `${statistics.start_row}-${statistics.end_row}` : "0"}</b> dari {statistics.total_row} data</span><div className="flex justify-center gap-1.5"><button disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>{Array.from({ length: Math.min(statistics.max_page || 1, 5) }, (_, index) => index + 1).map(number => <button key={number} onClick={() => setPage(number)} className={`h-9 w-9 rounded-lg font-semibold ${page === number ? "bg-blue-600 text-white" : "border bg-white"}`}>{number}</button>)}<button disabled={page >= (statistics.max_page || 1) || loading} onClick={() => setPage(value => value + 1)} className="grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div><div className="flex justify-end"><Select value={pageSize} onChange={value => { setPageSize(Number(value)); setPage(1); }} ariaLabel="Jumlah data" placement="top" className="w-36" options={[5, 10, 25, 50].map(value => ({ value, label: `${value} / Halaman` }))} /></div></footer>
  </section></div>
  <FormDrawer open={creating} title="Tambah Guru/Staf" noValidate onClose={requestCreateClose} onSubmit={saveCreate} footerActions={<><button type="button" onClick={requestCreateClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button><button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">{createStep === 4 ? "Simpan" : "Lanjut"}</button></>}>{createWizard}</FormDrawer>
  <FormDrawer open={selected !== null} title={editing ? "Edit Guru/Staf" : "Detail Guru/Staf"} noValidate={editing} onClose={editing ? requestEditClose : () => setSelected(null)} onSubmit={saveEdit} footerActions={editing ? <><button type="button" onClick={requestEditClose} className="rounded-lg border px-5 py-2.5 text-sm">Batal</button><button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Simpan</button></> : <><button type="button" onClick={() => setSelected(null)} className="rounded-lg border px-5 py-2.5 text-sm">Tutup</button>{access.canDelete && <button type="button" disabled={selected?.status === "Pending"} onClick={() => setDeleting(selected)} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-5 py-2.5 text-sm text-rose-600 disabled:opacity-40"><Trash2 className="h-4 w-4" />Hapus</button>}{access.canUpdate && <button type="button" disabled={selected?.status === "Pending"} onClick={() => { setFormErrors({}); setEditing(true); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white disabled:opacity-40"><Pencil className="h-4 w-4" />Edit</button>}</>}>{formContent(editing, editing)}</FormDrawer>
  <ConfirmDialog open={activating !== null} title="Aktifkan guru/staf?" description={activating ? `${activating.name} akan diaktifkan.` : ""} confirmLabel="Aktifkan" tone="success" onConfirm={confirmActivate} onCancel={() => setActivating(null)} />
  <ConfirmDialog open={deleting !== null} title="Hapus guru/staf?" description={deleting ? `${deleting.name} akan dihapus.` : ""} confirmLabel="Hapus" onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
  <UnsavedChangesDialog open={closePrompt} onContinue={() => setClosePrompt(false)} onDiscard={() => { if (closeIntent === "edit") { setClosePrompt(false); setSelected(null); setEditing(false); } else closeCreate(closeIntent === "back"); }} />
  {/*
  {closePrompt && <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"><section role="alertdialog" aria-modal="true" aria-labelledby="unsaved-teacher-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><h2 id="unsaved-teacher-title" className="text-lg font-bold">Buang perubahan?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Formulir sudah berisi data. Semua perubahan yang belum disimpan akan hilang.</p><div className="mtำนวน
  </div></section></div>}
  */}
  </>;
}
