import { useEffect } from "react";
import { getApiUrl } from "../config/api";
import { clearNetworkOfflineFlag, isNetworkAvailable, setNetworkAvailable } from "../utils/api";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;

// 5s, square to the minute boundary; add minutes through five, square to
// the hour boundary; repeat the pattern in hours through the day boundary.
const RETRY_DELAYS_MS = [
  5 * SECOND_MS,
  25 * SECOND_MS,
  1 * MINUTE_MS,
  2 * MINUTE_MS,
  3 * MINUTE_MS,
  4 * MINUTE_MS,
  5 * MINUTE_MS,
  25 * MINUTE_MS,
  1 * HOUR_MS,
  2 * HOUR_MS,
  3 * HOUR_MS,
  4 * HOUR_MS,
  5 * HOUR_MS,
  24 * HOUR_MS,
];

const STEADY_STATE_DELAY_MS = 4 * HOUR_MS;
export const getNetworkRetryDelay = failureCount => RETRY_DELAYS_MS[failureCount] ?? STEADY_STATE_DELAY_MS;

export default function NetworkStatusMonitor() {
  useEffect(() => {
    let stopped = false;
    let timer;
    let countdownTimer;
    let controller;
    let failureCount = 0;
    let recovering = false;

    const schedule = delay => {
      window.clearTimeout(timer);
      window.clearInterval(countdownTimer);
      if (!stopped && recovering) {
        let seconds = Math.ceil(delay / 1000);
        const publishCountdown = () => window.dispatchEvent(new CustomEvent("gakuren:network-retry", { detail: { seconds, checking: false } }));
        publishCountdown();
        countdownTimer = window.setInterval(() => {
          seconds = Math.max(0, seconds - 1);
          publishCountdown();
        }, 1000);
        timer = window.setTimeout(checkServer, delay);
      }
    };

    const checkServer = async () => {
      if (stopped || !recovering) return;
      window.clearInterval(countdownTimer);
      window.dispatchEvent(new CustomEvent("gakuren:network-retry", { detail: { seconds: 0, checking: true } }));
      controller?.abort();
      controller = new AbortController();

      try {
        const response = await fetch(getApiUrl("/v1/auth/test"), {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "text/plain" },
        });

        if (!response.ok) throw new Error(`Health check returned ${response.status}`);

        // A 200 response is authoritative: remove the persisted offline flag
        // instead of replacing it with another stored value.
        failureCount = 0;
        recovering = false;
        window.clearTimeout(timer);
        window.clearInterval(countdownTimer);
        clearNetworkOfflineFlag();
      } catch (error) {
        if (stopped || error.name === "AbortError") return;
        failureCount += 1;
        setNetworkAvailable(false);
        schedule(getNetworkRetryDelay(failureCount));
      }
    };

    const startRecovery = () => {
      if (stopped || recovering) return;
      recovering = true;
      failureCount = 0;
      schedule(getNetworkRetryDelay(0));
    };

    const stopRecovery = () => {
      recovering = false;
      failureCount = 0;
      window.clearTimeout(timer);
      window.clearInterval(countdownTimer);
      controller?.abort();
    };

    const retryNow = () => {
      if (!recovering || stopped) return;
      window.clearTimeout(timer);
      window.clearInterval(countdownTimer);
      checkServer();
    };

    const updateApplicationNetwork = event => {
      if (event.detail.online) stopRecovery();
      else startRecovery();
    };
    const handleBrowserOnline = () => {
      if (!isNetworkAvailable()) startRecovery();
    };
    const handleBrowserOffline = () => setNetworkAvailable(false);

    window.addEventListener("gakuren:network", updateApplicationNetwork);
    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);
    window.addEventListener("gakuren:network-retry-now", retryNow);
    window.addEventListener("gakuren:network-verify", startRecovery);

    // Health checks are recovery-only. A healthy application sends no requests.
    if (!isNetworkAvailable()) startRecovery();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearInterval(countdownTimer);
      controller?.abort();
      window.removeEventListener("gakuren:network", updateApplicationNetwork);
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      window.removeEventListener("gakuren:network-retry-now", retryNow);
      window.removeEventListener("gakuren:network-verify", startRecovery);
    };
  }, []);

  return null;
}
