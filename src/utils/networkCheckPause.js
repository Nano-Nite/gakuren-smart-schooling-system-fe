let consumers = 0;
export const areNetworkChecksPaused = () => consumers > 0;

// Reference counted so cleanup of one scanner cannot resume another's checks.
export function pauseNetworkChecks() {
  consumers += 1;
  window.dispatchEvent(new Event("gakuren:network-check-pause"));
  let released = false;
  return () => {
    if (released) return;
    released = true;
    consumers -= 1;
    window.dispatchEvent(new Event("gakuren:network-check-pause"));
  };
}
