import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Clock3, Info, X, XCircle } from "lucide-react";
import { clearNotifications, dismissNotification, getNotifications, subscribeNotifications } from "../utils/notifications";
import { playNotificationSound, unlockNotificationSound } from "../utils/notificationSound";

const tones = {
  success: CheckCircle2,
  pending: Clock3,
  info: Info,
  error: XCircle,
};

function Notification({ notification }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [exiting, setExiting] = useState(false);
  const remaining = useRef(notification.duration);
  useEffect(() => {
    if (exiting || hovered || focused || notification.duration <= 0) return;
    const started = Date.now();
    const timer = window.setTimeout(() => setExiting(true), Math.max(0, remaining.current));
    return () => { window.clearTimeout(timer); remaining.current -= Date.now() - started; };
  }, [exiting, hovered, focused, notification.id, notification.duration]);
  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(() => dismissNotification(notification.id), 600);
    return () => window.clearTimeout(timer);
  }, [exiting, notification.id]);
  const Icon = tones[notification.tone] || tones.info;
  return <li className={`${exiting ? "notification-fade-out" : "notification-slide-up"} pointer-events-auto flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 shadow-lg dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
    <p role={notification.tone === "error" ? "alert" : "status"} className="min-w-0 flex-1 break-words text-xs font-normal leading-5">{notification.message}</p>
    <button type="button" aria-label="Tutup notifikasi" onClick={() => setExiting(true)} className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current dark:hover:bg-white/10"><X aria-hidden="true" className="h-4 w-4" /></button>
  </li>;
}

export default function NotificationStack() {
  const notifications = useSyncExternalStore(subscribeNotifications, getNotifications, getNotifications);
  const latestId = notifications.at(-1)?.id;
  useEffect(() => {
    if (latestId) void playNotificationSound(latestId);
  }, [latestId]);
  useEffect(() => {
    window.addEventListener("pointerdown", unlockNotificationSound, { passive: true });
    window.addEventListener("keydown", unlockNotificationSound);
    return () => {
      window.removeEventListener("pointerdown", unlockNotificationSound);
      window.removeEventListener("keydown", unlockNotificationSound);
    };
  }, []);
  useEffect(() => () => clearNotifications(), []);
  return createPortal(<section aria-label="Notifikasi" className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[120] w-[280px] max-w-[calc(100vw-2rem)] sm:bottom-6 sm:left-6"><ol className="flex flex-col gap-2">{notifications.map(notification => <Notification key={notification.id} notification={notification} />)}</ol></section>, document.body);
}
