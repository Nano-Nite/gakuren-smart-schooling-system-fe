import { attendanceService } from "./attendanceService";
import { offlineAttendanceStore } from "./offlineAttendanceStore";

export const OFFLINE_ERROR_MESSAGES = {
  INVALID_QR: "Sistem tidak mengenali QR ini.",
  INVALID_SIGNATURE: "QR tidak memiliki tanda tangan Gakuren yang valid.",
  WRONG_SCHOOL: "QR berasal dari sekolah yang berbeda.",
  ALREADY_ATTENDED: "Kehadiran pengguna sudah tercatat.",
  CREDENTIAL_NOT_CACHED: "Kredensial tidak dapat diverifikasi secara luring.",
  DEVICE_NOT_TRUSTED: "Perangkat ini belum terdaftar sebagai perangkat absensi. Hubungkan ke internet untuk melakukan aktivasi.",
  OFFLINE_CONFIG_MISSING: "Konfigurasi luring belum tersedia.",
  ATTENDANCE_RULE_MISSING: "Aturan absensi luring tidak tersedia untuk pengguna ini.",
  LOCAL_SESSION_INVALID: "Sesi atau jadwal absensi lokal sedang tidak berlaku.",
};

export const offlineError = (code, detail) => Object.assign(new Error(detail || OFFLINE_ERROR_MESSAGES[code] || "Absensi luring gagal diproses."), { code, detail });

const timeToMinutes = value => {
  if (!value || !/^\d{1,2}:\d{2}/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const weekdayNumber = value => {
  if (Number.isFinite(Number(value))) return Number(value);
  return { SUNDAY: 0, MINGGU: 0, MONDAY: 1, SENIN: 1, TUESDAY: 2, SELASA: 2, WEDNESDAY: 3, RABU: 3, THURSDAY: 4, KAMIS: 4, FRIDAY: 5, JUMAT: 5, SATURDAY: 6, SABTU: 6 }[String(value).toUpperCase()];
};

const appliesToPerson = (rule, identity) => {
  const expected = String(rule.person_type || rule.target_type || "").toUpperCase();
  const actual = String(identity.person_type || identity.user_type || identity.role || "").toUpperCase();
  return !expected || expected === "ALL" || !actual || expected === actual;
};

export function resolveAttendanceRule(config, identity, recordedAt = new Date()) {
  const rules = config.attendance_rules || config.rules || [];
  if (!Array.isArray(rules) || !rules.length) throw offlineError("ATTENDANCE_RULE_MISSING");
  const day = recordedAt.getDay();
  const date = localDate(recordedAt);
  const minutes = recordedAt.getHours() * 60 + recordedAt.getMinutes();
  const candidates = rules.filter(rule => rule.active !== false && appliesToPerson(rule, identity));
  if (!candidates.length) throw offlineError("ATTENDANCE_RULE_MISSING");
  const rule = candidates.find(item => {
    if (item.valid_from && date < String(item.valid_from).slice(0, 10)) return false;
    if (item.valid_until && date > String(item.valid_until).slice(0, 10)) return false;
    if (Array.isArray(item.days) && item.days.length && !item.days.map(weekdayNumber).includes(day)) return false;
    const start = timeToMinutes(item.session_start || item.start_time);
    const end = timeToMinutes(item.session_end || item.end_time);
    return (start == null || minutes >= start) && (end == null || minutes <= end);
  });
  if (!rule) throw offlineError("LOCAL_SESSION_INVALID");
  const scheduled = timeToMinutes(rule.scheduled_time);
  const tolerance = Number(rule.late_tolerance_minutes ?? rule.late_tolerance ?? 0);
  return {
    rule,
    attendanceType: rule.attendance_type || "CHECK_IN",
    provisionalStatus: scheduled != null && minutes > scheduled + tolerance ? "LATE" : "PRESENT",
  };
}

export async function getOfflineContext() {
  const config = await offlineAttendanceStore.getOfflineConfig();
  if (!config) throw offlineError("OFFLINE_CONFIG_MISSING");
  const device = await offlineAttendanceStore.getTrustedDevice(config.school_uuid);
  if (!device?.trusted || !device.device_uuid || device.school_uuid !== config.school_uuid || !device.location_uuid) throw offlineError("DEVICE_NOT_TRUSTED");
  return { config, device };
}

export async function createOfflineAttendance(identity, credentialToken, config, device) {
  const now = new Date();
  const { rule, attendanceType, provisionalStatus } = resolveAttendanceRule(config, identity, now);
  const attendanceDate = localDate(now);
  const deduplicationKey = `${config.school_uuid}:${identity.user_uuid}:${attendanceDate}:${attendanceType}`;
  const existing = await offlineAttendanceStore.getAttendanceByDeduplicationKey(deduplicationKey);
  if (existing) {
    const time = new Date(existing.recorded_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    throw offlineError("ALREADY_ATTENDED", `Kehadiran sudah tercatat pada ${time}.`);
  }
  const localUuid = crypto.randomUUID();
  const record = {
    local_uuid: localUuid,
    local_id: localUuid,
    user_uuid: identity.user_uuid,
    credential_id: identity.credential_id,
    credential_token: credentialToken,
    display_name: identity.display_name || identity.name || "Pengguna Gakuren",
    person_type: identity.person_type || identity.user_type || identity.role || "Pengguna",
    class_name: identity.class_name || identity.class || "",
    attendance_type: attendanceType,
    attendance_status: provisionalStatus,
    provisional_status: provisionalStatus,
    attendance_date: attendanceDate,
    school_uuid: config.school_uuid,
    location_uuid: device.location_uuid,
    recorded_at: now.toISOString(),
    time_source: "TRUSTED_DEVICE",
    trusted_device_id: device.device_uuid,
    sync_status: "PENDING_SYNC",
    deduplication_key: deduplicationKey,
    rule_version: rule.version ?? config.rules_version,
    created_at: now.toISOString(),
  };
  await offlineAttendanceStore.addPendingAttendance(record);
  window.dispatchEvent(new CustomEvent("gakuren:offline-attendance-changed"));
  return record;
}

let activeSync;

async function performSync() {
  const pending = await offlineAttendanceStore.getPendingAttendances();
  if (!pending.length) return { total: 0, results: [] };
  const device = await offlineAttendanceStore.getTrustedDevice(pending[0].school_uuid);
  if (!device?.trusted) throw offlineError("DEVICE_NOT_TRUSTED");
  window.dispatchEvent(new CustomEvent("gakuren:attendance-sync-state", { detail: { state: "SYNCING", count: pending.length } }));
  const records = pending.map(record => ({
    local_uuid: record.local_uuid,
    user_uuid: record.user_uuid,
    credential_id: record.credential_id,
    credential_token: record.credential_token,
    attendance_type: record.attendance_type,
    location_uuid: record.location_uuid,
    recorded_at: record.recorded_at,
    time_source: record.time_source,
    provisional_status: record.provisional_status,
  }));
  try {
    const response = await attendanceService.syncOfflineAttendances(device.device_uuid, records);
    const results = Array.isArray(response) ? response : response?.items || response?.results || [];
    for (const result of results) {
      const localUuid = result.local_uuid || result.local_id;
      if (!localUuid || !["VERIFIED", "FLAGGED", "REJECTED"].includes(result.status)) continue;
      await offlineAttendanceStore.updateAttendance(localUuid, {
        sync_status: result.status,
        attendance_uuid: result.attendance_uuid,
        sync_reason: result.reason,
        synced_at: new Date().toISOString(),
      });
    }
    await offlineAttendanceStore.setSyncMetadata("last-sync", { success: true, result_count: results.length });
    window.dispatchEvent(new CustomEvent("gakuren:attendance-sync-state", { detail: { state: "COMPLETE", count: results.length } }));
    window.dispatchEvent(new CustomEvent("gakuren:offline-attendance-changed"));
    return { total: pending.length, results };
  } catch (error) {
    await offlineAttendanceStore.setSyncMetadata("last-sync", { success: false, error: error.message });
    window.dispatchEvent(new CustomEvent("gakuren:attendance-sync-state", { detail: { state: "ERROR", count: pending.length } }));
    throw error;
  }
}

export function syncOfflineAttendanceQueue() {
  if (!activeSync) activeSync = performSync().finally(() => { activeSync = null; });
  return activeSync;
}
