import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getGenderOptions } from "../utils/genderOptions";
import Select from "./Select";

export default function GenderSelect({ value, selectedName = "", error, onChange, size = "large", autoSelectFirst = false, label = "Jenis Kelamin" }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const heightClass = size === "large" ? "h-12 px-3.5" : "h-10 px-3";

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const activeOptions = await getGenderOptions({ forceRefresh: refreshKey > 0, signal: controller.signal });
        setOptions(activeOptions);
        setRequestError("");
        if (!value && activeOptions[0]) {
          const matchingOption = activeOptions.find(option => String(option.label).toLowerCase() === String(selectedName).toLowerCase());
          const defaultOption = matchingOption || (autoSelectFirst ? activeOptions[0] : null);
          if (defaultOption) onChange(defaultOption.value, defaultOption.label);
        }
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") { setOptions([]); setRequestError(fetchError.message); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [refreshKey]);

  return <label className="block text-sm"><span className="mb-2 block font-semibold">{label} <b className="text-rose-500">*</b></span>
    {loading ? <div className={`flex items-center gap-2 rounded-lg border border-slate-200 text-slate-500 ${heightClass}`}><RefreshCw className="h-4 w-4 animate-spin" />Memuat jenis kelamin…</div> : requestError ? <button type="button" aria-label="Muat ulang jenis kelamin" title="Muat ulang" onClick={() => setRefreshKey(current => current + 1)} className={`flex w-full items-center justify-between rounded-lg border border-rose-300 text-left text-rose-600 ${heightClass}`}><span className="min-w-0 truncate">Gagal memuat: {requestError}</span><RefreshCw className="ml-2 h-4 w-4 shrink-0" /></button> : options.length ? <Select value={value} onChange={selectedValue => { const selected = options.find(option => String(option.value) === String(selectedValue)); onChange(selectedValue, selected?.label || ""); }} ariaLabel={label} className="w-full" size={size} options={[{ value: "", label: "Pilih jenis kelamin" }, ...options]} /> : <button type="button" aria-label="Muat ulang jenis kelamin" title="Muat ulang" onClick={() => setRefreshKey(current => current + 1)} className={`flex w-full items-center justify-between rounded-lg border border-amber-300 text-left text-amber-700 hover:bg-amber-50 ${heightClass}`}><span className="min-w-0 truncate">Jenis kelamin aktif tidak ditemukan.</span><RefreshCw className="ml-2 h-4 w-4 shrink-0" /></button>}
    {error && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </label>;
}
