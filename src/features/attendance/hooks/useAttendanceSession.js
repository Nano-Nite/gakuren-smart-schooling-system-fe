import { useCallback, useEffect, useMemo, useState } from "react";
import { attendanceService } from "../services/attendanceService";

const errorCodes = {
  SESSION_EXPIRED: "Sesi absensi telah berakhir.",
  SESSION_CLOSED: "Sesi absensi telah ditutup.",
  INVALID_QR: "Kode QR tidak valid.",
  ALREADY_ATTENDED: "Kehadiran Anda sudah tercatat.",
  OUTSIDE_GEOFENCE: "Anda berada di luar area absensi.",
};

export const attendanceErrorMessage = error => {
  const code = error?.serverError || error?.code;
  if (errorCodes[code]) return errorCodes[code];
  return error?.message || "Tidak dapat terhubung ke server.";
};

const isExpired = session => session?.valid_until && Date.now() > new Date(session.valid_until).getTime();

export default function useAttendanceSession() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("RESTORING");
  const [error, setError] = useState("");
  const [attendances, setAttendances] = useState([]);
  const [serverSummary, setServerSummary] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    attendanceService.getActiveSession(controller.signal)
      .then(active => {
        if (!active) return setStatus("IDLE");
        setSession(active);
        setStatus(isExpired(active) ? "EXPIRED" : active.status === "ACTIVE" ? "ACTIVE" : "CLOSED");
      })
      .catch(requestError => {
        if (requestError.name === "AbortError") return;
        // The active-session endpoint may use 404 to indicate that no session exists.
        if (requestError.status === 404) { setSession(null); setStatus("IDLE"); return; }
        setError(attendanceErrorMessage(requestError)); setStatus("ERROR");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (status !== "ACTIVE" || !session?.session_uuid) return undefined;
    let disposed = false;
    let timer;
    let controller;
    const poll = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const result = await attendanceService.getSessionAttendances(session.session_uuid, controller.signal);
        if (!disposed) { setAttendances(result.items); setServerSummary(result.summary); setLastUpdated(new Date()); }
      } catch (requestError) {
        if (!disposed && requestError.name !== "AbortError") setError(attendanceErrorMessage(requestError));
      }
      if (!disposed) timer = window.setTimeout(poll, 5000);
    };
    poll();
    return () => { disposed = true; window.clearTimeout(timer); controller?.abort(); };
  }, [session?.session_uuid, status]);

  useEffect(() => {
    if (status !== "ACTIVE" || !session?.valid_until) return undefined;
    const remaining = new Date(session.valid_until).getTime() - Date.now();
    if (remaining <= 0) { setStatus("EXPIRED"); return undefined; }
    const timer = window.setTimeout(() => setStatus("EXPIRED"), remaining);
    return () => window.clearTimeout(timer);
  }, [session?.valid_until, status]);

  const createSession = useCallback(async payload => {
    setStatus("CREATING"); setError("");
    try {
      const created = await attendanceService.createSession(payload);
      setSession(created); setAttendances([]); setServerSummary(null);
      setStatus(isExpired(created) ? "EXPIRED" : "ACTIVE");
    } catch (requestError) { setError(attendanceErrorMessage(requestError)); setStatus("ERROR"); }
  }, []);

  const closeSession = useCallback(async () => {
    if (!session?.session_uuid) return;
    setStatus("CLOSING"); setError("");
    try {
      const closed = await attendanceService.closeSession(session.session_uuid);
      setSession(current => ({ ...current, ...closed, status: "CLOSED" })); setStatus("CLOSED");
    } catch (requestError) { setError(attendanceErrorMessage(requestError)); setStatus("ACTIVE"); }
  }, [session]);

  const summary = useMemo(() => {
    if (serverSummary) return serverSummary;
    const verified = attendances.filter(item => ["VERIFIED", "SUCCESS", "PRESENT"].includes(item.status || item.verification_status || item.attendance_status)).length;
    const anomaly = attendances.filter(item => ["REJECTED", "ANOMALY", "FLAGGED"].includes(item.status || item.verification_status)).length;
    return { successful: verified, waiting: Math.max(0, attendances.length - verified - anomaly), anomaly, total: attendances.length };
  }, [attendances, serverSummary]);

  return { session, status, error, attendances, summary, lastUpdated, createSession, closeSession };
}
