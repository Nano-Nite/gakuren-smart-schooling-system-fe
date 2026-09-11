import { notify } from "../utils/notifications";
import { buildTeacherStaffActivationPayload } from "../utils/teacherStaffActivation";
import useActivateData from "../hooks/useActivateData";
import { isStatusMutationBlocked } from "../utils/userStatus";
import CarouselNavigation from "../components/CarouselNavigation";
import TeacherStaffDetail from "../components/TeacherStaffDetail";
import { buildTeacherStaffEditForm, normalizeTeacherStaff } from "../utils/teacherStaffData";
import { buildTeacherStaffPayload, buildTeacherStaffUpdatePayload, getTeacherStaffCreateOutcome } from "../utils/teacherStaffPayload";
import AnimatedStepper from "../components/AnimatedStepper";
import StepTransition from "../components/StepTransition";
import useStepTransition from "../hooks/useStepTransition";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp, Check, Download, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import StatusChangeDialog from "../components/StatusChangeDialog";
import DatePicker from "../components/DatePicker";
import EducationLevelSelect from "../components/EducationLevelSelect";
import FormDrawer from "../components/FormDrawer";
import FormErrorDialog from "../components/FormErrorDialog";
import GenderSelect from "../components/GenderSelect";
import Select from "../components/Select";
import StatusBadge from "../components/StatusBadge";
import EmployeeStatusSelect from "../components/EmployeeStatusSelect";
import EmployeeStatusBadge from "../components/EmployeeStatusBadge";
import StatusRowActions from "../components/StatusRowActions";
import PositionSelector from "../components/PositionSelector";
import SubjectSelector from "../components/SubjectSelector";
import TitleSelector from "../components/TitleSelector";
import UnsavedChangesDialog from "../components/UnsavedChangesDialog";
import TablePagination from "../components/TablePagination";
import API_CONFIG from "../config/api";
import { authenticatedRequest } from "../utils/api";
import { getDailyReference } from "../utils/dailyReferenceCache";
import { getCrudPermissions } from "../utils/permissions";
import { formatIndonesianAcademicName } from "../utils/titleOptions";

const columns = [["Nama", "name"], ["NIP", "nip"], ["Email", "email"], ["No. HP / WhatsApp", "phone"], ["Jenis Pegawai", "occupation"], ["Status", "status_user"], ["Status Kepegawaian", "employee_status"]];
const centeredColumnKeys = new Set(["phone", "occupation", "status_user"]);
const statuses = { Aktif: "active", Nonaktif: "inactive", Menunggu: "pending", Pending: "pending" };
const statusLabels = { active: "Aktif", inactive: "Nonaktif", pending: "Pending" };
const newEducation = (isLast = false) => ({ id: globalThis.crypto?.randomUUID?.() || `education-${Date.now()}-${Math.random()}`, education_level_uuid: "", education_level_code: "", education_level_name: "", education_level_order: 0, institution: "", major: "", enrollment_year: "", graduation_year: "", is_last_education: isLast });
const createEmptyForm = () => ({ name: "", nik: "", nuptk: "", nip: "", email: "", phone: "", position: "", position_uuids: [], status: "Aktif", gender_uuid: "", gender: "", birth_place: "", birth_date: "", address: "", educations: [newEducation(true)], role: "", subject: "", subject_uuids: [], join_date: "", resign_date: "", employment_status: "", employment_status_uuid: "", title_prefix_uuids: [], title_suffix_uuids: [], title_prefixes: [], title_suffixes: [] });
const textFields = [["Nama", "name", "text", "Contoh: Ahmad Fauzi, S.Pd"], ["NIP", "nip", "text", "Masukkan NIP"], ["Email", "email", "email", "Contoh: nama@sekolah.sch.id"], ["No. HP / WhatsApp", "phone", "tel", "Contoh: 081234567890"], ["Jabatan", "position", "text", "Contoh: Guru Matematika"]];
const editSteps = ["Biodata", "Pendidikan", "Detail Pekerjaan"];
const wizardSteps = ["Biodata", "Pendidikan", "Jenis Pegawai", "Detail Pekerjaan"];
const minimumBirthDate = (() => { const date = new Date(); date.setFullYear(date.getFullYear() - 17); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; })();
const wizardFields = {
  1: ["name", "email", "phone", "gender_uuid", "birth_place", "birth_date", "address"],
  2: ["educations"],
  3: ["role"],
  4: ["position_uuids", "employment_status_uuid", "nik", "nip", "join_date"],
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
  if (key === "position_uuids") return Array.isArray(value) && value.length > 0 ? "" : "Field ini wajib diisi.";
  const input = String(value || "").trim();
  if (!input && ["subject", "nuptk", "nip"].includes(key)) return "";
  if (!input) return "Field ini wajib diisi.";
  if (key === "nik" && !/^[1-9]\d{5}(?:0[1-9]|[12]\d|3[01]|4[1-9]|[56]\d|7[01])(?:0[1-9]|1[0-2])\d{2}(?!0000)\d{4}$/.test(input)) return "NIK harus 16 digit dengan format kode wilayah, tanggal lahir, dan nomor urut yang valid.";
  if (key === "nuptk" && !/^\d{16}$/.test(input)) return "NUPTK harus terdiri dari 16 digit angka.";
  if (key === "nip") return /^\d{18}$/.test(input) ? "" : "NIP harus terdiri dari 18 digit angka.";
  if (["name", "email", "phone", "position"].includes(key)) return validateTeacherField(key, input);
  if (key === "birth_date" && input > minimumBirthDate) return "Guru atau staf harus berusia minimal 17 tahun.";
  if (["enrollment_year", "graduation_year"].includes(key) && (!/^\d{4}$/.test(input) || Number(input) > new Date().getFullYear())) return `Masukkan ${key === "enrollment_year" ? "tahun masuk" : "tahun lulus"} yang valid.`;
  return "";
};

const translateTeacherStaffError = requestError => {
  const source = `${requestError?.serverError || ""} ${requestError?.message || ""}`.toLowerCase();
  if (source.includes("multiple user") || source.includes("another user data")) return "Data pengguna terdeteksi lebih dari satu. Periksa kembali NIK, NUPTK, dan NIP yang dimasukkan.";
  if (source.includes("already exists") || source.includes("duplicate")) return "Data guru atau staf sudah terdaftar.";
  if (source.includes("position")) return "Jabatan yang dipilih tidak valid atau tidak tersedia.";
  if (source.includes("subject")) return "Mata pelajaran yang dipilih tidak valid atau tidak tersedia.";
  return requestError?.message || "Data guru atau staf gagal disimpan. Silakan coba lagi.";
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
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editSubmitLock = useRef(false);
  const [editError, setEditError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editOrigin, setEditOrigin] = useState(null);
  const [editSlide, setEditSlide] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [activating, setActivating] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [formErrors, setFormErrors] = useState({});
  const { createStep, displayedStep, setCreateStep, transitioning, headingRef, phase, direction, onAnimationEnd } = useStepTransition(creating);
  const [closePrompt, setClosePrompt] = useState(false);
  const [closeIntent, setCloseIntent] = useState("close");
  const createGuardActive = useRef(false);
  const ignoreNextPop = useRef(false);

  const hasCreateData = creating && hasMeaningfulFormData(form);
  const hasEditChanges = editing && selected && JSON.stringify(form) !== JSON.stringify(selected);
  const educationData = Array.isArray(form.educations) ? form.educations : [];

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
        setRows((payload.result || []).map(normalizeTeacherStaff));
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
  useEffect(() => {
    if (!selected?.id) return undefined;
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError("");
    const loadDetail = async () => {
      try {
        const response = await authenticatedRequest(`${API_CONFIG.GET_TEACHER_STAFF}?uuid=${encodeURIComponent(selected.id)}`, { method: "GET", signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!response.data?.uuid) throw new Error("Respons detail guru dan staf tidak valid.");
        const detail = normalizeTeacherStaff({ ...response.data, occupation: response.data.occupation ?? selected.occupation });
        const isStaff = detail.is_staff === true || /^(staff|staf)$/i.test(detail.occupation || "");
        const referenceTypes = ["gender", "education", "position", "title", "employeeStatus", ...(!isStaff ? ["subject"] : [])];
        const referenceEntries = await Promise.all(referenceTypes.map(async type => {
          const response = await getDailyReference(type, { signal: controller.signal, ...(["position", "employeeStatus"].includes(type) ? { isStaff } : {}) });
          return [type, response.result];
        }));
        if (controller.signal.aborted) return;
        const editForm = buildTeacherStaffEditForm(detail, Object.fromEntries(referenceEntries));
        setForm(editForm);
        setSelected(editForm);
      } catch (requestError) {
        if (!controller.signal.aborted) setDetailError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setDetailLoading(false);
      }
    };
    loadDetail();
    return () => controller.abort();
  }, [selected?.id, detailRefreshKey]);

  const openDetail = item => { setDetailLoading(true); setDetailError(""); setFormErrors({}); setForm({ ...item }); setSelected(item); setEditing(false); setEditOrigin(null); };
  const openEdit = item => { if (isStatusMutationBlocked(item.status)) return; setDetailLoading(true); setDetailError(""); setFormErrors({}); setForm({ ...item }); setSelected(item); setEditOrigin("table"); setEditSlide(0); setEditing(true); };
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
    const fields = [...wizardFields[step], ...(step === 4 ? (form.role === "teacher" ? ["nuptk", "subject"] : []) : [])];
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
    if (createSubmitting) return;
    if (!hasCreateData) { closeCreate(false); return; }
    setCloseIntent("close");
    setClosePrompt(true);
  };
  const requestEditClose = () => {
    if (editSubmitLock.current) return;
    if (!hasEditChanges) { if (editOrigin === "detail") { setEditing(false); setEditOrigin(null); } else setSelected(null); return; }
    setCloseIntent("edit");
    setClosePrompt(true);
  };
  const saveCreate = async event => {
    event.preventDefault();
    if (transitioning || createSubmitting || !access.canCreate) return;
    if (createStep < 4) { if (validateCreateStep(createStep)) setCreateStep(step => step + 1); return; }
    const allErrors = {};
    [1, 3, 4].forEach(step => [...wizardFields[step], ...(step === 4 ? (form.role === "teacher" ? ["nuptk", "subject"] : []) : [])].forEach(key => {
      const message = validateWizardField(key, form[key]);
      if (message) allErrors[key] = message;
    }));
    form.educations.forEach(education => requiredEducationFields(education).forEach(key => {
      const message = validateEducation(education, key);
      if (message) allErrors[educationErrorKey(education.id, key)] = message;
    }));
    setFormErrors(allErrors);
    if (Object.keys(allErrors).length) {
      const firstInvalidStep = Object.keys(allErrors).some(key => key.startsWith("education-")) ? 2 : [1, 3, 4].find(step => [...wizardFields[step], ...(step === 4 ? (form.role === "teacher" ? ["nuptk", "subject"] : []) : [])].some(key => allErrors[key]));
      setCreateStep(firstInvalidStep || 1);
      return;
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      const response = await authenticatedRequest(API_CONFIG.CREATE_TEACHER_STAFF, {
        method: "POST", body: buildTeacherStaffPayload(form),
      });
      const outcome = getTeacherStaffCreateOutcome(response);
      notify(outcome.message, { tone: outcome.pending ? "pending" : "success" });
      closeCreate(false);
      setPage(1);
      setStatus(outcome.pending ? "Pending" : "Semua");
      setRefreshKey(value => value + 1);
    } catch (requestError) {
      setCreateError(translateTeacherStaffError(requestError));
    } finally {
      setCreateSubmitting(false);
    }
  };
  const saveEdit = async event => {
    event.preventDefault();
    if (isStatusMutationBlocked(selected?.status) || isStatusMutationBlocked(form.status)) return;
    if (!editing || editSlide !== editSteps.length - 1 || detailLoading || detailError || editSubmitLock.current || !access.canUpdate) return;
    setEditError("");
    const fields = [...wizardFields[1].filter(key => key !== "email"), ...wizardFields[4], ...(form.role === "teacher" ? ["nuptk"] : [])];
    const errors = Object.fromEntries(fields.map(key => [key, validateWizardField(key, form[key])]).filter(([, message]) => message));
    educationData.forEach(education => requiredEducationFields(education).forEach(key => {
      const message = validateEducation(education, key);
      if (message) errors[educationErrorKey(education.id, key)] = message;
    }));
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      setEditError("Lengkapi atau perbaiki field yang ditandai sebelum menyimpan.");
      setEditSlide(wizardFields[1].some(key => errors[key]) ? 0 : Object.keys(errors).some(key => key.startsWith("education-")) ? 1 : 2);
      return;
    }
    editSubmitLock.current = true;
    setEditSubmitting(true);
    try {
      const payload = buildTeacherStaffUpdatePayload(form);
      const response = await authenticatedRequest(API_CONFIG.UPDATE_TEACHER_STAFF, { method: "PATCH", body: payload });
      const outcome = getTeacherStaffCreateOutcome(response);
      notify(outcome.pending ? "Pengajuan perubahan berhasil dikirim dan menunggu persetujuan." : "Perubahan berhasil dikirim. Data terbaru dimuat dari server.", { tone: outcome.pending ? "pending" : "success" });
      setSelected(null);
      setRefreshKey(value => value + 1);
    } catch (requestError) {
      setEditError(translateTeacherStaffError(requestError));
    } finally {
      editSubmitLock.current = false;
      setEditSubmitting(false);
    }
  };
  const confirmDelete = () => { if (!deleting || isStatusMutationBlocked(deleting.status)) return; setRows(current => current.filter(item => item.id !== deleting.id)); setStatistics(current => ({ ...current, total_row: Math.max(0, current.total_row - 1), end_row: Math.max(0, current.end_row - 1) })); setDeleting(null); setSelected(null); };
  const activation = useActivateData(API_CONFIG.UPDATE_TEACHER_STAFF, () => {
    setActivating(null);
    setSelected(null);
    setStatus("Semua");
    setRefreshKey(value => value + 1);
  }, buildTeacherStaffActivationPayload);
  const confirmActivate = () => { if (access.canUpdate) activation.activate(activating); };

  const updateTitles = (type, uuids, labels) => setForm(current => ({ ...current, [type === "prefix" ? "title_prefix_uuids" : "title_suffix_uuids"]: uuids, [type === "prefix" ? "title_prefixes" : "title_suffixes"]: labels }));
  const formContent = (editable, validate = false) => <div className="space-y-5">{textFields.map(([label, key, type, placeholder]) => { const fieldError = validate ? formErrors[key] : ""; return <label key={key} className="block text-sm"><span className="mb-2 block font-semibold">{label}{editable && <b className="text-rose-500"> *</b>}</span>{editable ? <><input type={type} inputMode={type === "tel" || key === "nip" ? "numeric" : undefined} value={form[key] ?? ""} placeholder={placeholder} aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? `${key}-error` : undefined} onChange={event => { const value = event.target.value; setForm(current => ({ ...current, [key]: value })); if (validate && formErrors[key]) setFormErrors(current => ({ ...current, [key]: validateTeacherField(key, value) })); }} onBlur={() => validate && setFormErrors(current => ({ ...current, [key]: validateTeacherField(key, form[key]) }))} className={`w-full rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${fieldError ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />{fieldError && <span id={`${key}-error`} role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{fieldError}</span>}</> : <div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">{form[key] || "-"}</div>}</label>; })}{editable && <TitleSelector previewName={form.name} prefixValues={form.title_prefix_uuids || []} suffixValues={form.title_suffix_uuids || []} onChange={updateTitles} />}{!editable && <><div className="text-sm"><span className="mb-2 block font-semibold">Nama dengan gelar</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">{formatIndonesianAcademicName(form.name, form.title_prefixes, form.title_suffixes) || "-"}</div></div><div className="text-sm"><span className="mb-2 block font-semibold">Status</span><div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3"><StatusBadge status={form.status} /></div></div></>}</div>;

  const updateWizardField = (key, value) => {
    setForm(current => ({ ...current, [key]: value, ...(key === "role" && current.role !== value ? { position: "", position_uuids: [], employment_status: "", employment_status_uuid: "" } : {}) }));
    if (formErrors[key]) setFormErrors(current => ({ ...current, [key]: validateWizardField(key, value) }));
  };
  const wizardInput = (label, key, options = {}) => <label className={`block text-sm ${options.full ? "sm:col-span-2" : ""}`}><span className="mb-2 block font-semibold">{label} {options.optional ? <span className="font-normal text-slate-400">(opsional)</span> : <b className="text-rose-500">*</b>}</span>{options.textarea ? <textarea rows="3" value={form[key] ?? ""} placeholder={options.placeholder} onChange={event => updateWizardField(key, event.target.value)} className={`w-full resize-none rounded-lg border px-3.5 py-3 outline-none focus:ring-2 ${formErrors[key] ? "border-rose-400 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} /> : <input disabled={key === "email" && !creating} type={options.type || "text"} inputMode={options.numeric ? "numeric" : undefined} value={form[key] ?? ""} placeholder={options.placeholder} onChange={event => updateWizardField(key, event.target.value)} className={`w-full rounded-lg border px-3.5 py-3 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${formErrors[key] ? "border-rose-400 focus:ring-rose-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />}{formErrors[key] && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{formErrors[key]}</span>}</label>;
  const updateEducation = (id, key, value, level) => {
    setForm(current => ({ ...current, educations: current.educations.map(education => education.id === id ? { ...education, [key]: value, ...(level ? { education_level_code: level.code, education_level_name: level.name, education_level_order: level.levelOrder } : {}) } : education) }));
    const errorKey = educationErrorKey(id, key);
    if (formErrors[errorKey]) {
      const education = form.educations.find(item => item.id === id);
      setFormErrors(current => ({ ...current, [errorKey]: validateEducation({ ...education, [key]: value, ...(level ? { education_level_order: level.levelOrder } : {}) }, key) }));
    }
    if (level && level.levelOrder < 3) setFormErrors(current => ({ ...current, [educationErrorKey(id, "major")]: "" }));
  };
  const addEducation = () => setForm(current => ({ ...current, educations: [...(current.educations || []), newEducation(!current.educations?.length)] }));
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
  const educationStep = creating && <div className="space-y-5">{form.educations.map((education, index) => <section key={education.id} className={`rounded-xl border p-4 transition-colors ${education.is_last_education ? "border-blue-300 bg-blue-50/50 dark:border-blue-500/70 dark:bg-white/[0.055]" : "border-slate-200 bg-white dark:border-white/15 dark:bg-white/[0.025]"}`}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold text-slate-800 dark:text-slate-100">Pendidikan {index + 1}</h4><div className="flex items-center gap-2"><label className="group inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-white/5"><input type="radio" name="last-education" checked={education.is_last_education} onChange={() => setLastEducation(education.id)} className="peer sr-only" /><span className="grid h-4 w-4 place-items-center rounded-full border-2 border-slate-400 bg-white transition peer-checked:border-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300 dark:border-slate-500 dark:bg-transparent dark:peer-checked:border-blue-400"><span className="h-2 w-2 scale-0 rounded-full bg-blue-600 transition peer-checked:scale-100 dark:bg-blue-400" /></span><span>Pendidikan terakhir</span></label>{form.educations.length > 1 && <button type="button" onClick={() => removeEducation(education.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30" aria-label={`Hapus pendidikan ${index + 1}`}><Trash2 className="h-3.5 w-3.5" />Nonaktifkan</button>}</div></div><div className="grid gap-5 sm:grid-cols-2">{educationInput(education, "Institusi pendidikan", "institution", { full: true, placeholder: "Nama institusi" })}<EducationLevelSelect value={education.education_level_uuid} error={formErrors[educationErrorKey(education.id, "education_level_uuid")]} onChange={(value, level) => updateEducation(education.id, "education_level_uuid", value, level)} />{educationInput(education, "Jurusan", "major", { placeholder: "Contoh: Matematika", required: education.education_level_order >= 3 })}{educationInput(education, "Tahun masuk", "enrollment_year", { numeric: true, placeholder: "Contoh: 2017" })}{educationInput(education, "Tahun keluar", "graduation_year", { numeric: true, placeholder: "Contoh: 2020" })}</div></section>)}<button type="button" onClick={addEducation} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-500/60 dark:text-blue-400 dark:hover:bg-white/5"><Plus className="h-4 w-4" />Tambah pendidikan</button></div>;
  const editEducationSlide = editing && <div className="space-y-5">{!educationData.length && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Belum ada riwayat pendidikan.</p>}{educationData.map((education, index) => <section key={education.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/15 dark:bg-white/[0.025]"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold">Pendidikan {index + 1}</h4><button type="button" onClick={() => removeEducation(education.id)} className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600" aria-label={`Hapus pendidikan ${index + 1}`}>Nonaktifkan</button></div><label className="mb-4 flex items-center gap-2 text-sm"><input type="radio" name="edit-last-education" checked={education.is_last_education} onChange={() => setLastEducation(education.id)} />Pendidikan terakhir</label><div className="grid gap-5 sm:grid-cols-2">{educationInput(education, "Institusi pendidikan", "institution", { full: true, placeholder: "Nama institusi" })}<EducationLevelSelect value={education.education_level_uuid} error={formErrors[educationErrorKey(education.id, "education_level_uuid")]} onChange={(uuid, level) => updateEducation(education.id, "education_level_uuid", uuid, level)} />{educationInput(education, "Jurusan", "major", { required: education.education_level_order >= 3, placeholder: "Jurusan" })}{educationInput(education, "Tahun masuk", "enrollment_year", { numeric: true, placeholder: "YYYY" })}{educationInput(education, "Tahun lulus", "graduation_year", { numeric: true, placeholder: "YYYY" })}</div></section>)}<button type="button" onClick={addEducation} className="w-full rounded-xl border border-dashed border-blue-300 px-4 py-3 text-sm font-semibold text-blue-600">Tambah pendidikan</button></div>;
  const editCarousel = editing && <div className="min-w-0"><CarouselNavigation labels={editSteps} active={editSlide} onChange={setEditSlide} ariaLabel="Pilih bagian edit" className="mb-6" /><header className="mb-6"><p className="text-xs font-medium text-blue-600 dark:text-blue-300">Bagian {editSlide + 1} dari {editSteps.length}</p><h3 className="mt-1 text-xl font-semibold">{editSteps[editSlide]}</h3><p className="mt-2 text-sm text-slate-500">{["Perbarui informasi pribadi dan kontak pegawai.", "Lengkapi riwayat pendidikan pegawai.", "Perbarui identitas dan penugasan pegawai."][editSlide]}</p></header>{editSlide === 0 && <div className="grid gap-5 sm:grid-cols-2">{wizardInput("Nama lengkap", "name", { full: true, placeholder: "Contoh: Ahmad Fauzi" })}<TitleSelector previewName={form.name} prefixValues={form.title_prefix_uuids || []} suffixValues={form.title_suffix_uuids || []} onChange={updateTitles} />{wizardInput("Email", "email", { type: "email", placeholder: "nama@sekolah.sch.id" })}{wizardInput("No. HP / WhatsApp", "phone", { numeric: true, placeholder: "081234567890" })}<GenderSelect value={form.gender_uuid} error={formErrors.gender_uuid} onChange={(uuid, label) => setForm(current => ({ ...current, gender_uuid: uuid, gender: label }))} />{wizardInput("Tempat lahir", "birth_place", { placeholder: "Kota kelahiran" })}<DatePicker id="edit-birth-date" label="Tanggal lahir" required max={minimumBirthDate} error={formErrors.birth_date} value={form.birth_date} onChange={value => updateWizardField("birth_date", value)} className="sm:col-span-2" />{wizardInput("Alamat", "address", { full: true, textarea: true, placeholder: "Alamat lengkap" })}</div>}{editSlide === 1 && editEducationSlide}{editSlide === 2 && <div className="grid gap-5"><div className="text-sm"><span className="mb-2 block font-semibold">Jenis pegawai <b className="text-rose-500">*</b></span><Select value={form.role} onChange={value => updateWizardField("role", value)} ariaLabel="Jenis pegawai" size="large" options={[{ value: "teacher", label: "Guru" }, { value: "staff", label: "Staf" }]} /><p className="mt-2 text-xs text-slate-500">Jika jenis pegawai diubah, pilih kembali jabatan dan status kepegawaian.</p></div>{wizardInput("NIK", "nik", { numeric: true, placeholder: "Masukkan NIK" })}{form.role === "teacher" && wizardInput("NUPTK", "nuptk", { optional: true, numeric: true, placeholder: "Masukkan NUPTK" })}{wizardInput("NIP", "nip", { optional: true, numeric: true, placeholder: "Masukkan NIP" })}<PositionSelector key={`position-${form.role}`} isStaff={form.role === "staff"} values={form.position_uuids || []} error={formErrors.position_uuids} onChange={(uuids, names) => setForm(current => ({ ...current, position_uuids: uuids, position: names.join(", ") }))} />{form.role === "teacher" && <SubjectSelector values={form.subject_uuids || []} onChange={(uuids, names) => setForm(current => ({ ...current, subject_uuids: uuids, subject: names }))} />}<EmployeeStatusSelect key={`employee-status-${form.role}`} isStaff={form.role === "staff"} value={form.employment_status_uuid} error={formErrors.employment_status_uuid} onChange={(uuid, name) => setForm(current => ({ ...current, employment_status_uuid: uuid, employment_status: name }))} /><DatePicker id="edit-join-date" label="Tanggal bergabung" required error={formErrors.join_date} value={form.join_date} onChange={value => updateWizardField("join_date", value)} /><DatePicker id="edit-resign-date" label="Tanggal resign" optional value={form.resign_date || ""} min={form.join_date || undefined} onChange={value => updateWizardField("resign_date", value)} /></div>}</div>;
  const createWizard = creating && <div className="employee-wizard min-w-0"><AnimatedStepper steps={wizardSteps} activeStep={createStep} disabled={transitioning || createSubmitting} onStepChange={setCreateStep} />
    <StepTransition phase={phase} direction={direction} onAnimationEnd={onAnimationEnd}>
    <div className="mb-6 flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Langkah {displayedStep} dari 4</p><h3 ref={headingRef} tabIndex={-1} className="mt-1 text-xl font-bold outline-none">{wizardSteps[displayedStep - 1]}</h3></div></div>
    {displayedStep === 1 && <div className="grid gap-5 sm:grid-cols-2">{wizardInput("Nama lengkap", "name", { full: true, placeholder: "Contoh: Ahmad Fauzi" })}<TitleSelector previewName={form.name} prefixValues={form.title_prefix_uuids} suffixValues={form.title_suffix_uuids} onChange={updateTitles} />{wizardInput("Email", "email", { type: "email", placeholder: "nama@sekolah.sch.id" })}{wizardInput("No. HP / WhatsApp", "phone", { numeric: true, placeholder: "081234567890" })}<GenderSelect value={form.gender_uuid} error={formErrors.gender_uuid} onChange={(uuid, label) => { setForm(current => ({ ...current, gender_uuid: uuid, gender: label })); if (formErrors.gender_uuid) setFormErrors(current => ({ ...current, gender_uuid: validateWizardField("gender_uuid", uuid) })); }} />{wizardInput("Tempat lahir", "birth_place", { placeholder: "Kota kelahiran" })}<DatePicker id="teacher-birth-date" label="Tanggal lahir" required value={form.birth_date} max={minimumBirthDate} error={formErrors.birth_date} onChange={value => updateWizardField("birth_date", value)} className="sm:col-span-2" />{wizardInput("Alamat", "address", { full: true, textarea: true, placeholder: "Alamat lengkap" })}</div>}
    {displayedStep === 2 && educationStep}
    {displayedStep === 3 && <div className="space-y-3"><p className="text-sm text-slate-500">Pilih jenis pegawai. Isian pada langkah terakhir akan disesuaikan dengan pilihan ini.</p>{[["teacher", "Guru", "Mengajar mata pelajaran dan menangani kegiatan akademik."], ["staff", "Staf", "Mendukung administrasi dan operasional sekolah."]].map(([value, label, description]) => <button key={value} type="button" onClick={() => updateWizardField("role", value)} className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${form.role === value ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${form.role === value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}>{form.role === value && <Check className="h-3.5 w-3.5" />}</span><span><b className="block">{label}</b><span className="mt-1 block text-xs text-slate-500">{description}</span></span></button>)}{formErrors.role && <p role="alert" className="text-xs font-medium text-rose-600">{formErrors.role}</p>}</div>}
    {displayedStep === 4 && <div className="grid grid-cols-1 gap-5">{wizardInput("NIK", "nik", { numeric: true, placeholder: "Masukkan NIK" })}{form.role === "teacher" && wizardInput("NUPTK", "nuptk", { optional: true, numeric: true, placeholder: "Masukkan NUPTK" })}{wizardInput("NIP", "nip", { optional: true, numeric: true, placeholder: "Masukkan NIP" })}<PositionSelector key={`position-${form.role}`} isStaff={form.role === "staff"} values={form.position_uuids} error={formErrors.position_uuids} onChange={(uuids, names) => { setForm(current => ({ ...current, position_uuids: uuids, position: names.join(", ") })); if (formErrors.position_uuids) setFormErrors(current => ({ ...current, position_uuids: validateWizardField("position_uuids", uuids) })); }} />{form.role === "teacher" && <SubjectSelector values={form.subject_uuids} onChange={(uuids, names) => setForm(current => ({ ...current, subject_uuids: uuids, subject: names }))} />}<EmployeeStatusSelect key={`employee-status-${form.role}`} isStaff={form.role === "staff"} value={form.employment_status_uuid} error={formErrors.employment_status_uuid} onChange={(uuid, name) => { setForm(current => ({ ...current, employment_status_uuid: uuid, employment_status: name })); if (formErrors.employment_status_uuid) setFormErrors(current => ({ ...current, employment_status_uuid: validateWizardField("employment_status_uuid", uuid) })); }} /><DatePicker id="teacher-join-date" label="Tanggal bergabung" required value={form.join_date} error={formErrors.join_date} onChange={value => updateWizardField("join_date", value)} /><DatePicker id="teacher-resign-date" label="Tanggal resign" optional value={form.resign_date || ""} min={form.join_date || undefined} onChange={value => updateWizardField("resign_date", value)} /></div>}
    </StepTransition>
  </div>;

  return <><Helmet><title>Guru dan Staf | Gakuren</title></Helmet><div className="p-4 sm:p-6"><section className="data-table-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
    <div className="flex flex-col gap-3 border-b border-slate-200 p-3 md:flex-row md:items-center md:justify-between lg:p-4"><div className="flex min-w-0 flex-1 items-center gap-2"><button title="Muat ulang" disabled={loading} onClick={() => setRefreshKey(value => value + 1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button><label className="relative min-w-0 flex-1 lg:max-w-56"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Cari data" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500" />{query && <button aria-label="Hapus pencarian" onClick={() => { setQuery(""); setPage(1); }} className="absolute right-1.5 top-1.5 p-2 text-slate-400"><X className="h-4 w-4" /></button>}</label><Select value={status} onChange={value => { setStatus(value); setPage(1); }} ariaLabel="Filter status" className="w-36 shrink-0 sm:w-40" options={[{ value: "Semua", label: "Semua Status" }, "Aktif", "Nonaktif", "Pending"]} /></div><div className="flex w-full justify-end gap-2 md:w-auto">{access.canCreate && <button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"><Download className="h-4 w-4" /><span className="hidden xl:inline">Import</span></button>}<button className="action-lift inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"><Upload className="h-4 w-4" /><span className="hidden xl:inline">Export</span></button>{access.canCreate && <button onClick={() => { setForm(createEmptyForm()); setCreateError(""); setFormErrors({}); setCreateStep(1); setCreating(true); }} className="action-lift inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white md:flex-none"><Plus className="h-4 w-4" />Tambah Guru dan Staf</button>}</div></div>
    <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1100px] table-fixed text-left text-xs"><thead className="bg-slate-100/80"><tr>{columns.map(([label, key]) => <th key={key} className={`px-3 py-3 font-medium ${centeredColumnKeys.has(key) ? "text-center" : ""}`}><button onClick={() => changeSort(key)} className={`group flex items-center gap-1 hover:text-blue-600 ${centeredColumnKeys.has(key) ? "w-full justify-center" : ""} ${sort.key === key ? "font-semibold text-blue-600" : ""}`}>{label}{sort.key === key ? sort.direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowDownUp className="h-3 w-3 opacity-0 group-hover:opacity-60" />}</button></th>)}<th className="w-28 px-3 py-3">Aksi</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} tabIndex={0} onClick={() => openDetail(row)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) openDetail(row); }} className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/50 focus:bg-blue-50 focus:outline-none"><td className="px-3 py-3 font-semibold">{row.name}</td><td className="px-3 py-3">{row.nip}</td><td className="truncate px-3 py-3" title={row.email}>{row.email}</td><td className="px-3 py-3 text-center">{row.phone}</td><td className="px-3 py-3 text-center">{row.position}</td><td className="px-3 py-3 text-center"><StatusBadge status={row.status} /></td><td className="px-3 py-3"><EmployeeStatusBadge status={row.employee_status} /></td><td className="px-3 py-3"><div className="flex gap-2"><StatusRowActions item={row} label="guru atau staf" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={setDeleting} onActivate={setActivating} /></div></td></tr>)}</tbody></table></div>
    <div className="divide-y divide-slate-100 md:hidden">{rows.map(row => <article key={row.id} onClick={() => openDetail(row)} className="cursor-pointer p-4 text-left hover:bg-blue-50/50"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0 flex-1 break-words"><p className="font-semibold">{row.name}</p><p className="mt-1 text-xs text-slate-500">NIP {row.nip} • {row.position}</p><p className="mt-1 truncate text-xs text-slate-500">{row.email}</p><p className="mt-1 text-xs text-slate-500">{row.phone}</p></div><div className="flex w-32 shrink-0 flex-col items-stretch gap-3"><div><p className="mb-1 text-center text-[10px] text-slate-500">Status User</p><StatusBadge status={row.status} className="w-full" /></div><div><p className="mb-1 text-center text-[10px] text-slate-500">Status Kepegawaian</p><EmployeeStatusBadge status={row.employee_status} className="w-full" /></div><div className="grid grid-cols-2 justify-items-center gap-2 [&>button:only-child]:col-span-2"><StatusRowActions item={row} label="guru atau staf" canUpdate={access.canUpdate} canDelete={access.canDelete} onEdit={openEdit} onDelete={setDeleting} onActivate={setActivating} /></div></div></div></article>)}</div>
    {error && <div className="grid place-items-center px-4 py-16 text-center text-rose-600"><p className="font-semibold">Gagal memuat data guru dan staf</p><p className="mt-1 text-xs">{error}</p><button disabled={loading} onClick={() => { setLoading(true); setRefreshKey(value => value + 1); }} className="mt-4 inline-flex min-w-24 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold">{loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}{loading ? "Memuat..." : "Coba lagi"}</button></div>}{loading && !rows.length && !error && <div className="grid place-items-center px-4 py-16"><RefreshCw className="h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-slate-500">Memuat data...</p></div>}{!loading && !error && !rows.length && <div className="grid place-items-center px-4 py-16"><Search className="h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">Tidak ada data ditemukan</p></div>}
    <TablePagination page={page} pageCount={statistics.max_page} pageSize={pageSize} total={statistics.total_row} start={statistics.start_row} end={statistics.end_row} loading={loading} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} />
  </section></div>
  <FormDrawer open={creating} title="Tambah Guru dan Staf" noValidate onClose={requestCreateClose} onSubmit={saveCreate} footerActions={<><button type="button" onClick={requestCreateClose} className="mr-auto rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-slate-50">Batal</button>{createStep > 1 && <button type="button" disabled={transitioning || createSubmitting} onClick={() => setCreateStep(step => step - 1)} aria-label="Kembali ke langkah sebelumnya" title="Kembali ke langkah sebelumnya" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5">Kembali</button>}<button type="submit" disabled={transitioning || createSubmitting} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{createSubmitting ? "Menyimpan..." : createStep === 4 ? "Simpan" : "Lanjut"}</button></>}>{<fieldset disabled={createSubmitting}>{createWizard}</fieldset>}</FormDrawer>
  <FormDrawer open={selected !== null} title={editing ? "Edit Guru dan Staf" : "Detail Guru dan Staf"} noValidate={editing} onClose={editing ? requestEditClose : () => setSelected(null)} onClosed={() => { if (editOrigin === "table") { setEditing(false); setEditOrigin(null); } }} onSubmit={saveEdit} footerActions={editing ? <><button type="button" onClick={requestEditClose} disabled={editSubmitting} className="rounded-lg border px-5 py-2.5 text-sm">Batal</button>{editSlide > 0 && <button type="button" disabled={editSubmitting || detailLoading || Boolean(detailError)} onClick={() => setEditSlide(step => step - 1)} className="rounded-lg border px-4 py-2.5 text-sm font-semibold">Kembali</button>}{editSlide < editSteps.length - 1 ? <button key="edit-next" type="button" disabled={editSubmitting || detailLoading || Boolean(detailError)} onClick={event => { event.preventDefault(); setEditSlide(step => step + 1); }} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Lanjut</button> : <button key="edit-save" type="submit" disabled={editSubmitting || detailLoading || Boolean(detailError)} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{editSubmitting ? "Menyimpan..." : "Simpan"}</button>}</> : <><button type="button" onClick={() => setSelected(null)} className="rounded-lg border px-5 py-2.5 text-sm">Tutup</button>{selected?.status === "Nonaktif" ? access.canUpdate && <button type="button" disabled={detailLoading || Boolean(detailError)} onClick={() => { setActivating(selected); setSelected(null); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><Check className="h-4 w-4" />Aktifkan</button> : <>{access.canDelete && <button type="button" disabled={detailLoading || Boolean(detailError) || isStatusMutationBlocked(selected?.status) || isStatusMutationBlocked(form.status)} onClick={() => setDeleting(selected)} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-5 py-2.5 text-sm text-rose-600 disabled:opacity-40"><Trash2 className="h-4 w-4" />Nonaktifkan</button>}{access.canUpdate && <button type="button" disabled={detailLoading || Boolean(detailError) || isStatusMutationBlocked(selected?.status) || isStatusMutationBlocked(form.status)} onClick={() => { if (isStatusMutationBlocked(selected?.status) || isStatusMutationBlocked(form.status)) return; setFormErrors({}); setEditOrigin("detail"); setEditSlide(0); setEditing(true); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white disabled:opacity-40"><Pencil className="h-4 w-4" />Edit</button>}</>}</>}>{detailLoading ? <div role="status" className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Memuat detail guru dan staf...</div> : detailError ? <div role="alert" className="text-sm text-rose-600"><p>{detailError}</p><button type="button" onClick={() => setDetailRefreshKey(value => value + 1)} className="mt-3 rounded-lg border px-4 py-2">Coba lagi</button></div> : <div key={`${selected?.id}-${editing ? "edit" : "detail"}`} className="teacher-staff-view-transition" data-view={editing ? "edit" : "detail"}>{editing ? <fieldset disabled={editSubmitting}>{editCarousel}</fieldset> : <TeacherStaffDetail data={form} />}</div>}</FormDrawer>
    <StatusChangeDialog item={activating} entityLabel="pegawai" action="activate" submitting={activation.submitting} error={activation.error} onConfirm={confirmActivate} onCancel={() => { if (!activation.submitting) { setActivating(null); activation.clearError(); } }} />
    <StatusChangeDialog item={deleting} entityLabel="pegawai" onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
  <UnsavedChangesDialog open={closePrompt} onContinue={() => setClosePrompt(false)} onDiscard={() => { if (closeIntent === "edit") { setClosePrompt(false); if (editOrigin === "detail") { setEditing(false); setEditOrigin(null); } else setSelected(null); } else closeCreate(closeIntent === "back"); }} />
  <FormErrorDialog open={Boolean(editError)} message={editError} onClose={() => setEditError("")} />
  <FormErrorDialog open={Boolean(createError)} message={createError} onClose={() => setCreateError("")} />
  {/*
  {closePrompt && <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"><section role="alertdialog" aria-modal="true" aria-labelledby="unsaved-teacher-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><h2 id="unsaved-teacher-title" className="text-lg font-bold">Buang perubahan?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Formulir sudah berisi data. Semua perubahan yang belum disimpan akan hilang.</p><div className="mtำนวน
  </div></section></div>}
  */}
  </>;
}
