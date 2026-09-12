import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerUrl from "leaflet/dist/images/marker-icon.png";
import markerRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

const icon = L.icon({ iconUrl: markerUrl, iconRetinaUrl: markerRetinaUrl, shadowUrl: markerShadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41] });

export default function LocationMap({ latitude, longitude, radius, editable, onChange }) {
  const container = useRef(null);
  const layers = useRef(null);
  const current = useRef({ editable, onChange });
  current.current = { editable, onChange };
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([-2.5, 118], 4);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    tiles.on("loading", () => setTileError(false));
    tiles.on("tileerror", () => setTileError(true));
    const marker = L.marker([0, 0], { icon, draggable: false, title: "Titik lokasi absensi", alt: "Titik lokasi absensi" });
    const circle = L.circle([0, 0], { radius: 100, color: "#3b82f6", fillOpacity: 0.15, weight: 2, interactive: false });
    const select = point => {
      if (!current.current.editable) return;
      const wrapped = point.wrap();
      current.current.onChange({ latitude: wrapped.lat.toFixed(6), longitude: wrapped.lng.toFixed(6) });
    };
    map.on("click", event => select(event.latlng));
    marker.on("dragend", () => select(marker.getLatLng()));
    layers.current = { map, marker, circle, tiles };
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      tiles.off();
      map.remove();
      layers.current = null;
    };
  }, []);

  useEffect(() => {
    const { map, marker, circle } = layers.current;
    const valid = Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
    if (!valid) {
      marker.remove(); circle.remove();
      return;
    }
    const point = [latitude, longitude];
    marker.setLatLng(point).addTo(map);
    if (editable) marker.dragging.enable(); else marker.dragging.disable();
    if (Number.isFinite(radius) && radius > 0) {
      circle.setLatLng(point).setRadius(radius).addTo(map);
      map.fitBounds(circle.getBounds(), { padding: [28, 28], maxZoom: 18, animate: false });
    } else {
      circle.remove(); map.setView(point, 17, { animate: false });
    }
  }, [latitude, longitude, radius, editable]);

  return <div>
    <div ref={container} role="region" aria-label="Peta lokasi absensi" className="relative isolate z-0 h-[340px] w-full sm:h-[380px]" />
    {tileError && <div role="status" className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 px-4 py-3 text-xs text-amber-800"><span>Peta belum dapat dimuat. Periksa koneksi internet; koordinat tetap dapat diisi manual.</span><button type="button" onClick={() => { setTileError(false); layers.current?.tiles.redraw(); }} className="min-h-9 font-semibold underline">Coba lagi</button></div>}
  </div>;
}
