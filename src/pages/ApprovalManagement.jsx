import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Ban, Check, CheckCircle2, CircleHelp, Clock3, RefreshCw, Search, X, XCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { hasPermission } from "../utils/permissions";
import Select from "../components/Select";
import TablePagination from "../components/TablePagination";
import API_CONFIG from "../config/api";
import { authenticatedRequest, getUserData } from "../utils/api";

const moduleColors = { Kelas: "bg-blue-50 text-blue-600", Siswa: "bg-emerald-50 text-emerald-600", Absensi: "bg-violet-50 text-violet-600", SDM: "bg-cyan-50 text-cyan-700", Akademik: "bg-sky-50 text-sky-600", Sarpras: "bg-pink-50 text-pink-600" };

const approvalFieldSchemas = {
  class: [["name", "Nama Kelas"], ["abbr_name", "Singkatan Kelas"], ["level", "Tingkat"], ["homeroom_teacher", "Wali Kelas"]],
  student: [["name", "Nama Siswa"], ["nis", "NIS"], ["class_name", "Kelas"], ["phone", "No. HP / WhatsApp"], ["gender", "Jenis Kelamin"], ["parent_name", "Nama Orang Tua/Wali"], ["parent_email", "Email Orang Tua/Wali"], ["parent_phone", "No. WhatsApp Orang Tua/Wali"], ["parent_address", "Alamat Orang Tua/Wali"]],
  teacher: [["name", "Nama"], ["nip", "NIP"], ["email", "Email"], ["phone", "No. HP / WhatsApp"], ["position", "Jabatan"]],
};

const commonApprovalFieldLabels = { name: "Nama", status: "Status", email: "Email", phone: "No. HP / WhatsApp", address: "Alamat", gender: "Jenis Kelamin", description: "Deskripsi", note: "Catatan" };

const approvalEntityEndpoints = {
  class: API_CONFIG.GET_CLASSES,
  kelas: API_CONFIG.GET_CLASSES,
  student: API_CONFIG.GET_STUDENTS,
  siswa: API_CONFIG.GET_STUDENTS,
  teacher: API_CONFIG.GET_TEACHER_STAFF,
  staff: API_CONFIG.GET_TEACHER_STAFF,
  guru: API_CONFIG.GET_TEACHER_STAFF,
};

export default function ApprovalManagement() {
  const currentUser = getUserData() || {};
  const currentUserName = currentUser.user_name || currentUser.name || currentUser.full_name || null;
  const canApprove = hasPermission("appr.approve");
  const canReject = hasPermission("appr.reject");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("mine");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [statistics, setStatistics] = useState({ start_row: 0, end_row: 0, total_row: 0, max_page: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, commitSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailRequest = useRef(null);
  const [note, setNote] = useState("");
  const [executing, setExecuting] = useState(false);
  const [actionProgress, setActionProgress] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusById, setStatusById] = useState({});
  const [notesById, setNotesById] = useState({});
  const setSelected = value => {
    if (value !== null) {
      openApprovalDetail(value);
      return;
    }
    detailRequest.current?.abort();
    const dialog = document.querySelector('[aria-label="Detail pengajuan"]');
    const panel = dialog?.querySelector("aside");
    const scrim = dialog?.querySelector(':scope > button[aria-label="Tutup detail"]');
    if (!panel) {
      setDetail(null);
      commitSelected(null);
      return;
    }
    panel.animate([{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], { duration: 500, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" });
    scrim?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease-in-out", fill: "forwards" });
    window.setTimeout(() => {
      setDetail(null);
      commitSelected(null);
    }, 500);
  };
  const filtered = rows;
  const maxPage = statistics.max_page || 1;

  async function openApprovalDetail(row) {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setDetail(row);
    setDetailLoading(true);
    setDetailError("");
    setActionError("");
    setNote("");
    try {
      const response = await authenticatedRequest(`${API_CONFIG.GET_MY_APPROVALS}?uuid=${encodeURIComponent(row.uuid)}`, {
        method: "GET",
        signal: controller.signal,
      });
      const payload = response.data || {};
      const instance = payload.instance || {};
      const requestedAt = formatDateTime(instance.requested_date);
      const nextDetail = {
        ...row,
        uuid: instance.uuid || row.uuid,
        id: instance.ticket_number || row.id,
        title: instance.workflow_name || row.title,
        applicant: instance.requested_by || row.applicant,
        role: instance.role_name || row.role,
        requesterUuid: instance.requested_by_uuid || instance.requester_uuid || instance.created_by_uuid || null,
        date: requestedAt.date,
        time: requestedAt.time,
        requestedDate: instance.requested_date,
        status: instance.status || row.status,
        action: instance.action_code || "-",
        workflowUuid: instance.workflow_uuid || row.workflowUuid,
        entityType: instance.entity_type || "-",
        entityUuid: instance.entity_uuid,
        stage: `Tahap ${instance.current_step ?? 0} dari ${instance.total_step ?? 0}`,
        requestData: instance.request_data && typeof instance.request_data === "object" ? instance.request_data : {},
        activeData: null,
        activeDataError: "",
        progress: Array.isArray(payload.progress) ? payload.progress : [],
      };
      setDetail(nextDetail);

      if (String(nextDetail.action).toUpperCase() === "UPDATE" && nextDetail.entityUuid) {
        const endpoint = getApprovalEntityEndpoint(nextDetail.entityType, nextDetail.module, nextDetail.requestData);
        if (!endpoint) {
          setDetail(current => current ? { ...current, activeDataError: "Endpoint data aktif untuk modul ini belum dikonfigurasi." } : current);
          return;
        }
        try {
          const activeResponse = await authenticatedRequest(endpoint, {
            method: "POST",
            signal: controller.signal,
            body: {
              search: null,
              filter: { uuid: nextDetail.entityUuid },
              page: 1,
              row_per_page: 1,
            },
          });
          const activeData = extractActiveEntity(activeResponse.data, nextDetail.entityUuid);
          setDetail(current => current ? { ...current, activeData, activeDataError: activeData ? "" : "Data aktif tidak ditemukan." } : current);
        } catch (activeRequestError) {
          if (activeRequestError.name !== "AbortError") {
            setDetail(current => current ? { ...current, activeDataError: activeRequestError.message || "Gagal memuat data aktif." } : current);
          }
        }
      }
    } catch (requestError) {
      if (requestError.name !== "AbortError") setDetailError(requestError.message);
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const filters = {};
        if (activeTab === "mine" && currentUserName) filters.requested_by = currentUserName;
        if (activeTab === "waiting") filters.status = "Active";
        if (activeTab === "processed") filters.status = ["Approved", "Rejected"];
        const response = await authenticatedRequest(API_CONFIG.GET_MY_APPROVALS, {
          method: "POST",
          signal: controller.signal,
          body: {
            search: query.trim() || null,
            filter: Object.keys(filters).length ? filters : null,
            page,
            row_per_page: pageSize,
            sort_by: [{ ticket_number: "desc" }],
          },
        });
        const payload = response.data || {};
        setRows((payload.result || []).map(item => {
          const requestedAt = item.requested_date ? new Date(item.requested_date) : null;
          const validDate = requestedAt && !Number.isNaN(requestedAt.getTime());
          return {
            uuid: item.uuid,
            workflowUuid: item.workflow_uuid,
            id: item.ticket_number || item.uuid,
            title: item.workflow_name || "Pengajuan",
            applicant: item.requested_by || "-",
            role: item.role_name || "-",
            module: item.module || "-",
            stage: `Tahap ${item.current_step ?? 0} dari ${item.total_step ?? 0}`,
            date: validDate ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(requestedAt) : "-",
            time: validDate ? new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(requestedAt) : "-",
            action: item.action || "UPDATE",
            status: item.status,
            details: [["Alur Kerja", item.workflow_name || "-"], ["Nomor Tiket", item.ticket_number || "-"], ["Tahap", `${item.current_step ?? 0} dari ${item.total_step ?? 0}`], ["Status", item.status || "-"]],
          };
        }));
        setStatistics(payload.data_statistic || { start_row: 0, end_row: 0, total_row: 0, max_page: 1 });
        setError("");
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
  }, [activeTab, currentUserName, page, pageSize, query, refreshKey]);

  useEffect(() => {
    const close = event => event.key === "Escape" && setSelected(null);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    if (selected) setNote("");
  }, [selected]);

  useLayoutEffect(() => {
    if (!selected) return undefined;
    const panel = document.querySelector('[aria-label="Detail pengajuan"] aside');
    if (!panel) return undefined;
    const actionBadge = panel.querySelector(":scope > div > div:first-child > span:last-child");
    if (actionBadge) actionBadge.dataset.approvalAction = selected.action.toLowerCase();
    const timeline = panel.querySelector(":scope > div > section:nth-of-type(3) > div");
    if (timeline) timeline.dataset.pastNote = notesById[selected.id] || selected.note || selected.approval_note || "";
    const animation = panel.animate(
      [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
      { duration: 500, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    );
    return () => animation.cancel();
  }, [notesById, selected]);

  const decide = async decision => {
    const command = { approved: "approve", rejected: "reject" }[decision] || decision;
    if (!detail || executing || !["approve", "reject"].includes(command)) return;

    const allowed = command === "approve" ? canApprove : canReject;
    const normalizeIdentity = value => String(value || "").trim().toLowerCase();
    const userUuid = currentUser.uuid || currentUser.user_uuid || currentUser.UserUUID || currentUser.id;
    const userRole = currentUser.role_name || currentUser.role?.name || currentUser.RoleName;
    const sameUuid = detail.requesterUuid && userUuid && normalizeIdentity(detail.requesterUuid) === normalizeIdentity(userUuid);
    const sameRole = detail.role && userRole && normalizeIdentity(detail.role) === normalizeIdentity(userRole);

    if (!allowed || sameUuid || sameRole || String(detail.status || "").toLowerCase() !== "active") {
      setActionError("Anda tidak memiliki izin untuk memproses pengajuan ini.");
      return;
    }

    const decisionNote = note.trim();
    setExecuting(true);
    setActionProgress(command === "approve" ? "Menyetujui pengajuan..." : "Menolak pengajuan...");
    setActionError("");
    try {
      await authenticatedRequest(API_CONFIG.EXECUTE_MY_APPROVAL, {
        method: "PATCH",
        body: { uuid: detail.uuid, command, note: decisionNote || null },
      });
      const nextStatus = command === "approve" ? "Approved" : "Rejected";
      setStatusById(current => ({ ...current, [detail.id]: nextStatus }));
      setNotesById(current => ({ ...current, [detail.id]: decisionNote }));
      setSuccessMessage(`Pengajuan ${detail.id} berhasil ${command === "approve" ? "disetujui" : "ditolak"}.`);
      setSelected(null);
      setRefreshKey(value => value + 1);
      window.setTimeout(() => setSuccessMessage(""), 5000);
    } catch (requestError) {
      const message = requestError.status >= 500
        ? "Pengajuan belum dapat diproses. Periksa konfigurasi status persetujuan atau coba lagi."
        : requestError.message;
      setActionError(message);
    } finally {
      setExecuting(false);
      setActionProgress("");
    }
  };

  const cancelApproval = async () => {
    if (!detail || executing) return;
    const normalizeIdentity = value => String(value || "").trim().toLowerCase();
    const userUuid = currentUser.uuid || currentUser.user_uuid || currentUser.UserUUID || currentUser.id;
    const ownsRequest = (detail.requesterUuid && userUuid && normalizeIdentity(detail.requesterUuid) === normalizeIdentity(userUuid))
      || (detail.applicant && currentUserName && normalizeIdentity(detail.applicant) === normalizeIdentity(currentUserName));
    const hasApprovalProgress = (detail.progress || []).some(step => {
      const actionCode = String(step.action_code || "").toUpperCase();
      return actionCode !== "SUBMIT" && (String(step.state || "").toLowerCase() === "past" || step.approve_date || step.act_by);
    });
    const cancellationNote = note.trim();

    if (!ownsRequest || String(detail.status || "").toLowerCase() !== "active" || hasApprovalProgress) {
      setActionError("Pengajuan ini tidak dapat dibatalkan oleh akun Anda.");
      return;
    }
    if (!cancellationNote) {
      setActionError("Alasan pembatalan wajib diisi.");
      return;
    }

    setExecuting(true);
    setActionProgress("Membatalkan pengajuan...");
    setActionError("");
    try {
      await authenticatedRequest(API_CONFIG.EXECUTE_MY_APPROVAL, {
        method: "PATCH",
        body: { uuid: detail.uuid, command: "cancel", note: cancellationNote },
      });
      setStatusById(current => ({ ...current, [detail.id]: "Cancelled" }));
      setNotesById(current => ({ ...current, [detail.id]: cancellationNote }));
      setSuccessMessage(`Pengajuan ${detail.id} berhasil dibatalkan.`);
      setSelected(null);
      setRefreshKey(value => value + 1);
      window.setTimeout(() => setSuccessMessage(""), 5000);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setExecuting(false);
      setActionProgress("");
    }
  };

  return <>
    <Helmet><title>Persetujuan | Gakuren</title></Helmet>
    <div className="p-4 sm:p-6">
      {successMessage && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><Check className="h-5 w-5" />{successMessage}</div>}
      <section className="approval-table data-table-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 px-3 pt-2 sm:px-4">
          {[["mine", "Pengajuan Saya"], ["waiting", "Perlu Tindakan"], ["processed", "Riwayat Keputusan"], ["all", "Semua Pengajuan"]].map(([value, label]) => <button key={value} onClick={() => { setActiveTab(value); setPage(1); }} className={`relative shrink-0 px-3 py-3 text-xs font-semibold transition sm:px-4 ${activeTab === value ? "text-blue-600 dark:text-blue-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"}`}>{label}{activeTab === value && <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-blue-600 dark:bg-blue-300" />}</button>)}
        </div>
        <div className="flex min-w-0 flex-col gap-2 border-b border-slate-200 p-3 md:flex-row md:flex-wrap md:items-center lg:gap-3 lg:p-4 xl:flex-nowrap">
          <button title="Muat ulang" disabled={loading} onClick={() => setRefreshKey(value => value + 1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
          <label className="relative min-w-0 flex-1 lg:max-w-80"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Cari pengajuan" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />{query && <button onClick={() => { setQuery(""); setPage(1); }} aria-label="Hapus pencarian" className="absolute right-1.5 top-1.5 rounded p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</label>
        </div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full table-fixed text-left text-xs"><thead className="bg-slate-100/80"><tr>{[["Pengajuan", "31%"], ["Pemohon", "21%"], ["Tahap", "17%"], ["Diajukan", "17%"], ["Status", "14%"]].map(([label, width]) => <th key={label} style={{ width }} className="px-4 py-3 font-medium text-slate-600">{label}</th>)}</tr></thead><tbody>{filtered.map(row => { const state = statusById[row.id] || row.status; return <tr key={row.id} tabIndex={0} onClick={() => { setSelected(row); setNote(""); }} onKeyDown={event => (event.key === "Enter" || event.key === " ") && setSelected(row)} className="cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/60 focus:bg-blue-50 focus:outline-none"><td className="px-4 py-4"><p className="font-semibold text-blue-600">{row.title}</p><p className="mt-1 text-[11px] text-slate-500">{row.id}</p></td><td className="px-4 py-4"><p className="font-semibold">{row.applicant}</p><p className="mt-1 text-slate-500">{row.role}</p></td><td className="px-4 py-4"><span className="rounded bg-blue-50 px-2 py-1 text-blue-600">{row.stage}</span></td><td className="px-4 py-4"><p>{row.date}</p><p className="mt-1 text-slate-500">{row.time}</p></td><td className="px-4 py-4"><Status value={state} /></td></tr>; })}</tbody></table></div>
        <div className="divide-y divide-slate-100 md:hidden">{filtered.map(row => <button key={row.id} onClick={() => setSelected(row)} className="block w-full min-w-0 p-4 text-left hover:bg-blue-50/60"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0 flex-1 break-words"><p className="font-semibold text-blue-600">{row.title}</p><p className="mt-1 text-xs text-slate-500">{row.applicant}</p></div><Status value={statusById[row.id] || row.status} /></div></button>)}</div>
        {error && <div className="grid place-items-center px-4 py-16 text-center text-rose-600"><p className="font-semibold">Gagal memuat data persetujuan</p><p className="mt-1 text-xs">{error}</p></div>}
        {loading && !filtered.length && <div className="grid place-items-center px-4 py-16 text-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-slate-500">Memuat data persetujuan...</p></div>}
        {!loading && !error && !filtered.length && <div className="grid place-items-center px-4 py-20 text-center"><Search className="h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold">Pengajuan tidak ditemukan</p></div>}
        <TablePagination page={page} pageCount={maxPage} pageSize={pageSize} total={statistics.total_row} start={statistics.start_row} end={statistics.end_row} loading={loading} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1); }} pageSizeOptions={[5, 10, 20, 25]} />
      </section>
    </div>

    {detail && <ApprovalDetailDrawer approval={detail} currentUser={currentUser} loading={detailLoading} error={detailError} actionError={actionError} actionProgress={actionProgress} executing={executing} note={note} setNote={setNote} canApprove={canApprove} canReject={canReject} onClose={() => { if (!executing) setSelected(null); }} onDecide={decide} onCancel={cancelApproval} onRetry={() => openApprovalDetail(detail)} />}
    {selected && <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Detail pengajuan"><button className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" onClick={() => setSelected(null)} aria-label="Tutup detail" /><aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-[slideInRight_200ms_ease-out]"><header className="flex items-start justify-between border-b border-slate-200 px-5 py-5"><div><h2 className="text-lg font-bold">{selected.title}</h2><p className="mt-1 text-sm text-slate-500">{selected.id}</p></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></header><div className="flex-1 space-y-5 overflow-y-auto p-5"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"><Clock3 className="h-4 w-4" />Menunggu Persetujuan</span><span className="rounded bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-600">{selected.action}</span></div><section className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 p-4 text-xs"><div><p className="text-slate-500">Pemohon</p><p className="mt-2 font-bold">{selected.applicant}</p><p className="mt-1 text-slate-500">{selected.role}</p></div><div className="border-l pl-3"><p className="text-slate-500">Diajukan</p><p className="mt-2 font-bold">{selected.date}</p><p className="mt-1 text-slate-500">{selected.time}</p></div><div className="border-l pl-3"><p className="text-slate-500">Modul</p><p className="mt-2"><span className={`rounded px-2 py-1 font-medium ${moduleColors[selected.module]}`}>{selected.module}</span></p></div></section><section><h3 className="mb-3 text-sm font-bold">Rincian Pengajuan</h3><dl className="space-y-3 rounded-xl border border-slate-200 p-4">{selected.details.map(([label, value]) => <div key={label} className="grid grid-cols-[140px_1fr] gap-3 text-sm"><dt className="text-slate-500">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl></section><section><h3 className="mb-3 text-sm font-bold">Progres Persetujuan</h3><div className="relative ml-2 border-l-2 border-emerald-400 pl-6"><span className="absolute -left-3 -top-0 grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">1</span><p className="text-sm font-semibold">{selected.applicant} | Diajukan</p><p className="mt-1 text-xs text-slate-500">{selected.date}, {selected.time}</p><div className="relative mt-6"><span className="absolute -left-[35px] top-0 grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span><p className="text-sm font-semibold text-blue-600">Menunggu keputusan Anda</p><p className="mt-1 text-xs text-slate-500">Tahap aktif</p></div></div></section><label className="block"><span className="mb-2 block text-sm font-bold">Catatan (opsional)</span><textarea maxLength={500} value={note} onChange={event => setNote(event.target.value)} placeholder="Tulis catatan atau instruksi tambahan..." className="h-28 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><span className="-mt-6 mr-3 block text-right text-xs text-slate-400">{note.length} / 500</span></label></div><footer className="grid grid-cols-2 gap-3 border-t border-slate-200 p-5">{canReject && <button onClick={() => decide("rejected")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-500 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"><X className="h-4 w-4" />Tolak</button>}{canApprove && <button onClick={() => decide("approved")} className={`${!canReject ? "col-span-2" : ""} inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700`}><Check className="h-4 w-4" />Setujui</button>}{!canApprove && !canReject && <p className="col-span-2 rounded-lg bg-slate-50 p-3 text-center text-sm text-slate-500">Anda tidak memiliki izin untuk memproses pengajuan ini.</p>}</footer></aside></div>}
  </>;
}

function Status({ value }) {
  const normalized = String(value || "").toLowerCase();
  const badgeClass = "inline-flex w-24 items-center justify-center rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold";
  if (normalized === "approved") return <span className={`${badgeClass} gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-200`}><CheckCircle2 className="h-3.5 w-3.5 shrink-0" />Disetujui</span>;
  if (normalized === "rejected") return <span className={`${badgeClass} gap-1 border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-400/50 dark:bg-rose-500/25 dark:text-rose-100`}><XCircle className="h-3.5 w-3.5 shrink-0" />Ditolak</span>;
  if (["cancel", "cancelled", "canceled"].includes(normalized)) return <span className={`${badgeClass} gap-1 border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/50 dark:bg-violet-400/15 dark:text-violet-200`}><Ban className="h-3.5 w-3.5 shrink-0" />Dibatalkan</span>;
  if (normalized === "active") return <span className={`${badgeClass} gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-200`}><Clock3 className="h-3.5 w-3.5" />Menunggu</span>;
  return <span className={`${badgeClass} gap-1 border-slate-200 bg-slate-100 text-slate-600`}><CircleHelp className="h-3.5 w-3.5 shrink-0" />{value || "-"}</span>;
}

function formatDateTime(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return { date: "-", time: "-" };
  return {
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(parsed),
    time: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(parsed),
  };
}

function getApprovalEntityEndpoint(entityType, moduleName, requestData) {
  const descriptors = [entityType, moduleName].map(value => String(value || "").toLowerCase());
  const directMatch = Object.entries(approvalEntityEndpoints).find(([key]) => descriptors.some(value => value.includes(key)));
  if (directMatch) return directMatch[1];
  const schema = getApprovalFieldSchema(entityType, requestData);
  if (schema === approvalFieldSchemas.class) return API_CONFIG.GET_CLASSES;
  if (schema === approvalFieldSchemas.student) return API_CONFIG.GET_STUDENTS;
  if (schema === approvalFieldSchemas.teacher) return API_CONFIG.GET_TEACHER_STAFF;
  return null;
}

function extractActiveEntity(payload, entityUuid) {
  if (!payload || typeof payload !== "object") return null;
  const candidates = [payload.instance, payload.result, payload.data, payload];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const match = candidate.find(item => String(item?.uuid || item?.UUID || "") === String(entityUuid));
      if (match) return match;
      if (candidate.length === 1 && candidate[0] && typeof candidate[0] === "object") return candidate[0];
    } else if (candidate && typeof candidate === "object") {
      const nested = candidate.instance || candidate.result;
      if (nested && nested !== candidate) {
        const extracted = extractActiveEntity(nested, entityUuid);
        if (extracted) return extracted;
      }
      if (candidate.uuid || candidate.UUID || candidate.name || candidate.Name) return candidate;
    }
  }
  return null;
}

function getComparableFieldValue(data, key) {
  const normalizedKey = normalizeApprovalFieldKey(key);
  const entry = Object.entries(data || {}).find(([candidateKey]) => normalizeApprovalFieldKey(candidateKey) === normalizedKey);
  return entry?.[1];
}

function areApprovalValuesEqual(currentValue, requestedValue) {
  const normalize = value => {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "object") return JSON.stringify(sanitizeRequestValue(value));
    return String(value).trim();
  };
  return normalize(currentValue) === normalize(requestedValue);
}

function formatFieldLabel(key) {
  if (commonApprovalFieldLabels[key]) return commonApprovalFieldLabels[key];
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function isSensitiveRequestField(key) {
  const normalized = String(key).replace(/[_\s-]+/g, "").toLowerCase();
  return normalized.includes("uuid") || normalized.includes("createddate") || normalized.includes("updateddate") || normalized.includes("createdat") || normalized.includes("updatedat");
}

function sanitizeRequestValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeRequestValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !isSensitiveRequestField(key)).map(([key, child]) => [key, sanitizeRequestValue(child)]));
}

function ApprovalDetailDrawer({ approval, currentUser, loading, error, actionError, actionProgress, executing, note, setNote, canApprove, canReject, onClose, onDecide, onCancel, onRetry }) {
  const isActive = String(approval.status || "").toLowerCase() === "active";
  const isUpdate = String(approval.action || "").toUpperCase() === "UPDATE";
  const requestEntries = getApprovalRequestEntries(approval.requestData || {}, approval.entityType);
  const timeline = approval.progress || [];
  const cancelIndex = timeline.findIndex(step => String(step.action_code || "").toUpperCase() === "CANCEL");
  const normalizeIdentity = value => String(value || "").trim().toLowerCase();
  const userUuid = currentUser.uuid || currentUser.user_uuid || currentUser.UserUUID || currentUser.id;
  const userRole = currentUser.role_name || currentUser.role?.name || currentUser.RoleName;
  const userName = currentUser.user_name || currentUser.name || currentUser.full_name;
  const sameUuid = Boolean(approval.requesterUuid && userUuid && normalizeIdentity(approval.requesterUuid) === normalizeIdentity(userUuid));
  const sameRole = Boolean(approval.role && userRole && normalizeIdentity(approval.role) === normalizeIdentity(userRole));
  const sameName = Boolean(approval.applicant && userName && normalizeIdentity(approval.applicant) === normalizeIdentity(userName));
  const initiatedByCurrentUser = sameUuid || sameName;
  const decisionDisabled = sameUuid || sameRole;
  const canProcessApproval = (canApprove || canReject) && !decisionDisabled;
  const hasApprovalProgress = timeline.some(step => {
    const actionCode = String(step.action_code || "").toUpperCase();
    return actionCode !== "SUBMIT" && (String(step.state || "").toLowerCase() === "past" || step.approve_date || step.act_by);
  });
  const canCancel = initiatedByCurrentUser && !hasApprovalProgress;

  return <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Detail pengajuan">
    <button disabled={executing} className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" onClick={onClose} aria-label="Tutup detail" />
    <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-200 px-5 py-5">
        <div><h2 className="text-lg font-bold">{approval.title}</h2><p className="mt-1 text-sm text-slate-500">{approval.id}</p></div>
        <button disabled={executing} onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-40"><X className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {loading && <div className="grid min-h-52 place-items-center"><div className="text-center"><RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-slate-500">Memuat detail pengajuan...</p></div></div>}
        {!loading && error && <div className="grid min-h-52 place-items-center text-center text-rose-600"><div><p className="font-semibold">Gagal memuat detail pengajuan</p><p className="mt-1 text-xs">{error}</p><button onClick={onRetry} className="mt-4 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold hover:bg-rose-50">Coba lagi</button></div></div>}
        {!loading && !error && <>
          <div className="flex items-center justify-between gap-3"><Status value={approval.status} /><span className="rounded bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-600">{approval.action}</span></div>
          <section className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-700 dark:bg-transparent">
            <div><p className="text-slate-500 dark:text-white">Pemohon</p><p className="mt-2 font-bold dark:text-white">{approval.applicant}</p><p className="mt-1 text-slate-500 dark:text-white">{approval.role}</p></div>
            <div className="border-l pl-3"><p className="text-slate-500 dark:text-white">Diajukan</p><p className="mt-2 font-bold dark:text-white">{approval.date}</p><p className="mt-1 text-slate-500 dark:text-white">{approval.time}</p><p className="mt-2 text-slate-500 dark:text-white">{approval.stage}</p></div>
          </section>
          <section><h3 className="mb-3 text-sm font-bold dark:text-white">Rincian Pengajuan</h3>{isUpdate && approval.activeDataError && <div role="status" className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"><span>Data diajukan tetap ditampilkan, tetapi pembanding data aktif gagal dimuat: {approval.activeDataError}</span><button type="button" onClick={onRetry} className="shrink-0 rounded-md border border-amber-300 px-2.5 py-1.5 font-semibold hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40">Coba lagi</button></div>}<dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4 dark:divide-slate-800 dark:border-slate-700 dark:bg-transparent">{isUpdate && approval.activeData && requestEntries.length > 0 && <div className="grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] gap-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white"><span>Kolom</span><span>Saat Ini</span><span>Diajukan</span></div>}{requestEntries.length ? requestEntries.map(([key, value, label]) => {
            const currentValue = getComparableFieldValue(approval.activeData, key);
            const changed = isUpdate && approval.activeData && !areApprovalValuesEqual(currentValue, value);
            return isUpdate && approval.activeData ? <div key={key} className={`grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] gap-3 py-3 text-sm ${changed ? "-mx-4 bg-blue-50/70 px-4 dark:bg-blue-950/30" : ""}`}><dt className="text-slate-500 dark:text-white"><span className="block">{label}</span>{changed && <span className="mt-1.5 block w-fit rounded border border-sky-300 bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700 dark:border-sky-400/60 dark:bg-sky-400/10 dark:text-sky-200">Berubah</span>}</dt><dd className="whitespace-pre-wrap break-words font-medium text-slate-600 dark:text-white">{formatFieldValue(sanitizeRequestValue(currentValue))}</dd><dd className={`whitespace-pre-wrap break-words font-semibold dark:text-white ${changed ? "text-blue-700" : "text-slate-600"}`}>{formatFieldValue(sanitizeRequestValue(value))}</dd></div> : <div key={key} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 py-3 text-sm"><dt className="text-slate-500 dark:text-white">{label}</dt><dd className="whitespace-pre-wrap break-words font-medium dark:text-white">{formatFieldValue(sanitizeRequestValue(value))}</dd></div>;
          }) : <div className="py-4 text-sm text-slate-500">Tidak ada data permintaan.</div>}</dl></section>
          <article><h3 className="mb-3 text-sm font-bold">Progres Persetujuan</h3><div className="space-y-0">{timeline.length ? timeline.map((step, index) => {
            const stepNumber = timeline.slice(0, index + 1).filter(item => !["SUBMIT", "CANCEL"].includes(String(item.action_code || "").toUpperCase())).length;
            return <ProgressStep key={`${step.action_code || step.role_name}-${index}`} step={step} index={index} stepNumber={stepNumber} isLast={index === timeline.length - 1} cancelIndex={cancelIndex} approvalStatus={approval.status} />;
          }) : <p className="text-sm text-slate-500">Belum ada progres persetujuan.</p>}</div></article>
          {actionError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{actionError}</div>}
          {executing && <div role="status" className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-3 text-sm text-blue-700"><RefreshCw className="h-4 w-4 animate-spin" />{actionProgress}</div>}
          {isActive && (canProcessApproval || canCancel) && <label className="block"><span className="mb-2 block text-sm font-bold">Catatan {canCancel ? <b className="text-rose-500">*</b> : "(opsional)"}</span><textarea disabled={executing} required={canCancel} maxLength={120} value={note} onChange={event => setNote(event.target.value)} placeholder={canCancel ? "Alasan pembatalan wajib diisi..." : "Tulis catatan atau instruksi tambahan..."} className="h-28 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50" /><span className="-mt-6 mr-3 block text-right text-xs text-slate-400">{note.length} / 120</span></label>}
        </>}
      </div>
      {!loading && !error && isActive && <footer className="border-t border-slate-200 p-5">{canCancel ? <button disabled={!note.trim()} title={!note.trim() ? "Isi alasan pembatalan terlebih dahulu." : undefined} onClick={onCancel} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><X className="h-4 w-4" />Batalkan Pengajuan</button> : <div className="grid grid-cols-2 gap-3">{canReject && <button disabled={decisionDisabled} title={decisionDisabled ? "Pembuat pengajuan tidak dapat memproses pengajuannya sendiri." : undefined} onClick={() => onDecide("rejected")} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-rose-500 px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><X className="h-4 w-4 shrink-0" /><span className="truncate">Tolak</span></button>}{canApprove && <button disabled={decisionDisabled} title={decisionDisabled ? "Pembuat pengajuan tidak dapat memproses pengajuannya sendiri." : undefined} onClick={() => onDecide("approved")} className={`${!canReject ? "col-span-2" : ""} inline-flex min-w-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40`}><Check className="h-4 w-4 shrink-0" /><span className="truncate">Setujui</span></button>}{!canApprove && !canReject && <p className="col-span-2 rounded-lg bg-slate-50 p-3 text-center text-sm text-slate-500">Anda tidak memiliki izin untuk memproses pengajuan ini.</p>}</div>}</footer>}
    </aside>
  </div>;
}

function ProgressStep({ step, index, stepNumber, isLast, cancelIndex, approvalStatus }) {
  const backendState = String(step.state || "future").toLowerCase();
  const actionCode = String(step.action_code || "").toUpperCase();
  const isSubmission = actionCode === "SUBMIT";
  const isCancelled = actionCode === "CANCEL";
  const isRejected = actionCode === "REJECT";
  const isApproved = actionCode === "APPROVE";
  const isFinalized = String(approvalStatus || "").toLowerCase() !== "active";
  const hasRecordedAction = isSubmission || isCancelled || isRejected || isApproved;
  const state = hasRecordedAction ? "past" : isFinalized && backendState === "current" ? "future" : backendState;
  const isAffectedByCancellation = cancelIndex >= 0 && index >= cancelIndex;
  const isNegativeDecision = isCancelled || isRejected;
  const shouldPulse = !isFinalized && !hasRecordedAction && cancelIndex < 0 && state === "current";
  const title = isSubmission ? "Pengajuan dibuat" : isCancelled ? "Pengajuan dibatalkan" : isRejected ? `Ditolak oleh ${step.role_name || "-"}` : step.role_name || "-";
  const approvedAt = formatDateTime(step.approve_date);
  const nodeClass = isNegativeDecision ? "bg-rose-600 text-white" : isAffectedByCancellation ? "approval-timeline-node-cutout border-2 border-rose-400 bg-rose-50 text-rose-600" : state === "past" ? "bg-emerald-600 text-white" : state === "current" ? "bg-amber-500 text-white" : "approval-timeline-node-cutout border-2 border-slate-300 bg-white text-slate-500";
  const nodeSizeClass = shouldPulse ? "-ml-1 h-9 w-9 text-sm" : "h-7 w-7 text-xs";
  const lineClass = isNegativeDecision || (cancelIndex >= 0 && index >= cancelIndex) ? "bg-rose-400" : state === "past" ? "bg-emerald-400" : "bg-slate-200";
  const titleClass = isNegativeDecision || isAffectedByCancellation ? "text-rose-600" : state === "current" ? "text-amber-600" : "";
  return <div className="relative grid grid-cols-[28px_1fr] gap-3 pb-6 last:pb-0">
    {!isLast && <span className={`absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-0.5 ${lineClass}`} />}
    <span className={`relative z-10 grid place-items-center rounded-full font-bold ${nodeSizeClass} ${nodeClass}`}>{shouldPulse && <span aria-hidden="true" className="absolute inset-0 -z-10 animate-ping rounded-full bg-amber-400 opacity-40" />}<span className="relative z-10">{isNegativeDecision ? <X className="h-4 w-4" /> : state === "past" ? <Check className="h-4 w-4" /> : stepNumber}</span></span>
    <div className="pt-1"><p className={`text-sm font-semibold ${titleClass}`}>{title}</p>{isSubmission ? <p className="mt-1 text-xs text-slate-600">{step.act_by || "-"} • {step.role_name || "-"}</p> : step.act_by && <p className={`mt-1 text-xs ${isNegativeDecision || isAffectedByCancellation ? "text-rose-500" : "text-slate-600"}`}>Diproses oleh {step.act_by}</p>}{step.approve_date && <p className={`mt-1 text-xs ${isNegativeDecision || isAffectedByCancellation ? "text-rose-500" : "text-slate-500"}`}>{approvedAt.date}, {approvedAt.time}</p>}{state === "current" && !isFinalized && !hasRecordedAction && !isAffectedByCancellation && <p className="mt-1 text-xs text-amber-600">Menunggu persetujuan</p>}{step.note && <p className={`mt-2 rounded-lg p-2.5 text-xs italic ${isNegativeDecision || isAffectedByCancellation ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"}`}>{step.note}</p>}</div>
  </div>;
}

const normalizeApprovalFieldKey = key => String(key || "").replace(/[^a-z0-9]/gi, "").toLowerCase();

function getApprovalFieldSchema(entityType, requestData) {
  const normalizedType = String(entityType || "").toLowerCase();
  const normalizedKeys = new Set(Object.keys(requestData || {}).map(normalizeApprovalFieldKey));
  if (normalizedType.includes("class") || normalizedType.includes("kelas") || normalizedKeys.has("abbrname") || normalizedKeys.has("homeroomteacher")) return approvalFieldSchemas.class;
  if (normalizedType.includes("student") || normalizedType.includes("siswa") || normalizedKeys.has("nis")) return approvalFieldSchemas.student;
  if (normalizedType.includes("teacher") || normalizedType.includes("staff") || normalizedType.includes("guru") || normalizedKeys.has("nip")) return approvalFieldSchemas.teacher;
  return [];
}

function getApprovalRequestEntries(requestData, entityType) {
  const visibleEntries = Object.entries(requestData || {}).filter(([key]) => !isSensitiveRequestField(key));
  const entriesByKey = new Map(visibleEntries.map(([key, value]) => [normalizeApprovalFieldKey(key), { key, value }]));
  const schema = getApprovalFieldSchema(entityType, requestData || {});
  const alwaysVisibleStudentFields = new Set(["parentname", "parentemail", "parentphone", "parentaddress"]);
  const configuredEntries = schema.filter(([key]) => entriesByKey.has(normalizeApprovalFieldKey(key)) || (schema === approvalFieldSchemas.student && alwaysVisibleStudentFields.has(normalizeApprovalFieldKey(key)))).map(([key, label]) => {
    const normalizedKey = normalizeApprovalFieldKey(key);
    const entry = entriesByKey.get(normalizedKey);
    entriesByKey.delete(normalizedKey);
    return [entry?.key || key, entry?.value ?? null, label];
  });
  const allEntries = [...configuredEntries, ...Array.from(entriesByKey.values(), ({ key, value }) => [key, value, formatFieldLabel(key)])];
  if (schema !== approvalFieldSchemas.student) return allEntries;
  const isParentField = ([key]) => alwaysVisibleStudentFields.has(normalizeApprovalFieldKey(key));
  return [...allEntries.filter(entry => !isParentField(entry)), ...allEntries.filter(isParentField)];
}
