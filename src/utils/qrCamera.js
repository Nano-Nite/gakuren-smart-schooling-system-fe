import QrScanner from "qr-scanner";

// Decode locally: native BarcodeDetector where supported, bundled worker otherwise.
export function createQrCamera(video, onDecode, deviceId = "") {
  let stopped = false;
  const scanner = new QrScanner(video, result => {
    if (!stopped && result.data) onDecode(result.data);
  }, {
    preferredCamera: deviceId || "environment",
    maxScansPerSecond: 25,
    returnDetailedScanResult: true,
    calculateScanRegion: source => {
      const width = source.videoWidth || 640;
      const height = source.videoHeight || 480;
      const scale = Math.min(1, 960 / Math.max(width, height));
      return { x: 0, y: 0, width, height, downScaledWidth: Math.round(width * scale), downScaledHeight: Math.round(height * scale) };
    },
  });
  scanner.setInversionMode("both");
  return {
    async start() {
      await scanner.start();
      if (stopped) { scanner.destroy(); return; }
      const track = video.srcObject?.getVideoTracks?.()[0];
      const capabilities = track?.getCapabilities?.() || {};
      const settings = {};
      for (const key of ["focusMode", "exposureMode", "whiteBalanceMode"]) {
        if (capabilities[key]?.includes("continuous")) settings[key] = "continuous";
      }
      if (Object.keys(settings).length) {
        // Camera tuning is best effort; unsupported combinations must not stop scanning.
        await track.applyConstraints({ advanced: [settings] }).catch(() => {});
      }
    },
    stop() { stopped = true; scanner.destroy(); },
  };
}
