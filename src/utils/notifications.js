let notifications = [];
let nextId = 0;
const listeners = new Set();
const publish = next => {
  notifications = next;
  listeners.forEach(listener => listener());
};

export function notify(message, { tone = "success", duration = 7000 } = {}) {
  if (!message) return;
  const id = ++nextId;
  publish([...notifications, { id, message, tone, duration }].slice(-3));
  return id;
}

export const dismissNotification = id => publish(notifications.filter(item => item.id !== id));
export const clearNotifications = () => publish([]);
export const getNotifications = () => notifications;
export const subscribeNotifications = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
