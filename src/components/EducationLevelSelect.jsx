import { useEffect, useState } from "react";
import Select from "./Select";
import { RefreshCw } from "lucide-react";
import { getEducationLevelOptions } from "../utils/educationLevelOptions";

export default function EducationLevelSelect({ value, error, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try { setOptions(await getEducationLevelOptions({ forceRefresh: refreshKey > 0, signal: controller.signal })); setRequestError(""); }
      catch (fetchError) { if (fetchError.name !== "AbortError") { setOptions([]); setRequestError(fetchError.message); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    load();
    return () => controller.abort();
  }, [refreshKey]);

  return <div className="text-sm"><span className="mb-2 block font-semibold">Jenjang pendidikan <b className="text-rose-500">*</b></span>
    {loading ? <div className="flex h-12 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Memuat jenjang...</div> : requestError ? <button type="button" onClick={() => setRefreshKey(current => current + 1)} className="flex h-12 w-full items-center justify-between rounded-lg border border-rose-300 px-3.5 text-left text-rose-600"><span className="truncate">Gagal memuat data</span><RefreshCw className="h-4 w-4 shrink-0" /></button> : options.length ? <Select value={value} size="large" ariaLabel="Jenjang pendidikan" className="w-full" options={[{ value: "", label: "Pilih jenjang" }, ...options]} onChange={uuid => onChange(uuid, options.find(option => String(option.value) === String(uuid)))} /> : <button type="button" onClick={() => setRefreshKey(current => current + 1)} className="flex h-12 w-full items-center justify-between rounded-lg border border-amber-300 px-3.5 text-left text-amber-700"><span>Jenjang pendidikan tidak ditemukan.</span><RefreshCw className="h-4 w-4" /></button>}
    {error && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </div>;
}
