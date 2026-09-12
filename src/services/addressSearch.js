const cache = new Map();
let nextRequest = 0;
export async function searchAddresses(query, signal) {
  const text = query.trim().replace(/\s+/g, " ");
  if (text.length < 3) throw new Error("Masukkan minimal 3 karakter alamat atau nama tempat.");
  signal?.throwIfAborted();
  const endpoint = import.meta.env.VITE_GEOCODING_URL || "https://photon.komoot.io/api/";
  const key = `${endpoint}:${text.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key);
  if (Date.now() < nextRequest) throw new Error("Tunggu sebentar sebelum mencari kembali.");
  nextRequest = Date.now() + 1500;
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("q", text);
  url.searchParams.set("limit", "5");
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 15000);
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" });
    if (!response.ok) throw new Error(response.status === 429 ? "Layanan pencarian sedang sibuk. Coba lagi nanti." : "Alamat belum dapat dicari. Coba lagi nanti.");
    const data = await response.json();
    if (!Array.isArray(data.features)) throw new Error("Hasil pencarian alamat tidak valid.");
    const results = data.features.flatMap(feature => {
      const [longitude, latitude] = feature.geometry?.coordinates || [];
      if (feature.geometry?.type !== "Point" || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return [];
      const p = feature.properties || {};
      const parts = [p.name, [p.street, p.housenumber].filter(Boolean).join(" "), p.district, p.city, p.state, p.postcode, p.country].filter(value => typeof value === "string" && value.trim());
      const label = [...new Set(parts)].join(", ");
      return label ? [{ label, latitude, longitude }] : [];
    }).slice(0, 5);
    if (cache.size >= 50) cache.delete(cache.keys().next().value);
    cache.set(key, results);
    return results;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (controller.signal.aborted) throw new Error("Pencarian terlalu lama. Periksa koneksi dan coba lagi.");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
