import { useEffect, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { searchAddresses } from "../services/addressSearch";

export default function AddressSearch({ disabled, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(null);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    if (disabled) { pending.current?.abort(); setBusy(false); setResults(null); }
  }, [disabled]);
  const search = async event => {
    event.preventDefault();
    if (disabled || busy) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true); setResults(null); setError("");
    try {
      const items = await searchAddresses(query, controller.signal);
      if (!controller.signal.aborted) setResults(items);
    } catch (err) { if (!controller.signal.aborted) setError(err.message || "Pencarian gagal. Periksa koneksi internet."); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  };
  return <div className="space-y-2 rounded-xl border border-slate-200 p-3">
    <form onSubmit={search}>
      <label htmlFor="location-address-search" className="text-sm font-medium">Cari alamat atau nama tempat</label>
      <div className="mt-2 flex gap-2"><input id="location-address-search" disabled={disabled} value={query} maxLength={200} onChange={event => {
        pending.current?.abort(); setBusy(false); setError(""); setResults(null); setQuery(event.target.value);
      }} placeholder="Contoh: nama sekolah, kota" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50" />
      <button type="submit" disabled={disabled || busy || query.trim().length < 3} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white disabled:opacity-40"><Search aria-hidden="true" className="h-4 w-4" />{busy ? "Mencari..." : "Cari"}</button></div>
    </form>
    {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
    {busy && <p role="status" className="text-xs text-slate-500">Mencari alamat...</p>}
    {results && <div aria-label="Hasil pencarian alamat" className="max-h-64 space-y-1 overflow-y-auto">
      {!results.length && <p role="status" className="py-2 text-xs text-slate-500">Alamat tidak ditemukan. Tambahkan nama kota atau pilih titik di peta.</p>}
      {results.map((item, index) => <button key={index} type="button" disabled={disabled} onClick={() => { onSelect(item); setQuery(item.label); setResults(null); }} className="flex min-h-11 w-full gap-2 rounded-lg p-2 text-left text-sm hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" /><span className="break-words">{item.label}</span></button>)}
    </div>}
    <p className="text-xs leading-5 text-slate-500">Pilih hasil untuk mengisi koordinat. Data <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a>, pencarian oleh <a href="https://photon.komoot.io" target="_blank" rel="noreferrer" className="underline">Photon</a>.</p>
  </div>;
}
