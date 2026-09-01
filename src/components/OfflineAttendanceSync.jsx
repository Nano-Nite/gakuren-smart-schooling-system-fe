import { useEffect } from "react";
import { syncOfflineAttendanceQueue } from "../services/offlineAttendanceService";
import { isNetworkAvailable, isUserAuthenticated } from "../utils/api";

export default function OfflineAttendanceSync() {
  useEffect(() => {
    let syncing = false;
    const sync = async () => {
      if (syncing || !isNetworkAvailable() || !isUserAuthenticated()) return;
      syncing = true;
      try {
        await syncOfflineAttendanceQueue();
      } catch {
        // Network recovery monitor will trigger another attempt after connectivity is confirmed.
      } finally { syncing = false; }
    };
    const onNetwork = event => { if (event.detail.online) sync(); };
    window.addEventListener("gakuren:network", onNetwork);
    sync();
    return () => window.removeEventListener("gakuren:network", onNetwork);
  }, []);
  return null;
}
