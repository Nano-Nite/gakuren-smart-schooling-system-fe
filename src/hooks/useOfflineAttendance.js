import { useCallback, useEffect, useState } from "react";
import { offlineAttendanceStore } from "../services/offlineAttendanceStore";
import { syncOfflineAttendanceQueue } from "../services/offlineAttendanceService";
import { isNetworkAvailable } from "../utils/api";

export default function useOfflineAttendance() {
  const [records, setRecords] = useState([]);
  const [online, setOnline] = useState(isNetworkAvailable());
  const [syncState, setSyncState] = useState("IDLE");
  const [syncError, setSyncError] = useState("");

  const refresh = useCallback(async () => setRecords(await offlineAttendanceStore.getAllAttendances()), []);
  useEffect(() => {
    refresh();
    const changed = () => refresh();
    const network = event => setOnline(event.detail.online);
    const sync = event => setSyncState(event.detail.state);
    window.addEventListener("gakuren:offline-attendance-changed", changed);
    window.addEventListener("gakuren:network", network);
    window.addEventListener("gakuren:attendance-sync-state", sync);
    return () => {
      window.removeEventListener("gakuren:offline-attendance-changed", changed);
      window.removeEventListener("gakuren:network", network);
      window.removeEventListener("gakuren:attendance-sync-state", sync);
    };
  }, [refresh]);

  const syncNow = useCallback(async () => {
    if (!isNetworkAvailable()) return;
    setSyncError("");
    try { await syncOfflineAttendanceQueue(); await refresh(); }
    catch (error) { setSyncError(error.message || "Sinkronisasi gagal. Data tetap tersimpan di perangkat."); }
  }, [refresh]);

  const pendingCount = records.filter(item => item.sync_status === "PENDING_SYNC").length;
  const reviewCount = records.filter(item => ["FLAGGED", "REJECTED"].includes(item.sync_status)).length;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayCount = records.filter(item => item.attendance_date === today).length;
  return { records, recent: records.slice(0, 8), pendingCount, reviewCount, todayCount, online, syncState, syncError, refresh, syncNow };
}
