import soundUrl from "../../universfield-new-notification-051-494246.mp3?url";

let context;
let bufferPromise;
let source;
let lastNotificationId = 0;

function getContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  context ||= new AudioContext();
  return context;
}

// Unlock playback on a user gesture without downloading the sound at startup.
export function unlockNotificationSound() {
  try {
    const audio = getContext();
    if (audio?.state === "suspended") void audio.resume().catch(() => {});
  } catch { /* Audio availability must never block the interface. */ }
}

export async function playNotificationSound(id) {
  if (id <= lastNotificationId) return;
  lastNotificationId = id;
  try {
    const audio = getContext();
    if (!audio) return;
    if (audio.state === "suspended") void audio.resume().catch(() => {});
    // Fetch and decode once per page session, including concurrent notifications.
    bufferPromise ||= fetch(soundUrl).then(response => {
      if (!response.ok) throw new Error("Notification sound unavailable");
      return response.arrayBuffer();
    }).then(bytes => audio.decodeAudioData(bytes));
    const buffer = await bufferPromise;
    if (id !== lastNotificationId || audio.state !== "running") return;
    source?.stop();
    source = audio.createBufferSource();
    source.buffer = buffer;
    source.connect(audio.destination);
    const playing = source;
    playing.onended = () => { playing.disconnect(); if (source === playing) source = null; };
    playing.start();
  } catch { /* A missing file or autoplay restriction must not hide notifications. */ }
}
