import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getDailyReference } from "../utils/dailyReferenceCache";
import Select from "./Select";

export default function EmployeeStatusSelect({ isStaff, value, error, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setOptions([]);
      setRequestError("");
      try {
        const response = await getDailyReference("employeeStatus", { isStaff, forceRefresh: refreshKey > 0, signal: controller.signal });
        if (controller.signal.aborted) return;
        const items = response.result;
        setOptions([...new Map(items.filter(item => item.uuid && item.name).map(item => [item.uuid, { value: item.uuid, label: item.name }])).values()]);
      } catch (fetchError) {
        if (!controller.signal.aborted) setRequestError("Gagal memuat status kepegawaian. Silakan coba lagi.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [isStaff, refreshKey]);

  return <div className="text-sm"><span className="mb-2 block font-semibold">Status kepegawaian <b className="text-rose-500">*</b></span>
    {loading ? <div role="status" className="flex h-12 items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Memuat status kepegawaian…</div> : requestError || !options.length ? <button type="button" aria-label="Muat ulang status kepegawaian" onClick={() => setRefreshKey(current => current + 1)} className="flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border border-rose-300 px-3.5 py-2 text-left text-rose-600"><span>{requestError || "Status kepegawaian tidak ditemukan. Muat ulang."}</span><RefreshCw className="h-4 w-4 shrink-0" /></button> : <Select value={value} onChange={uuid => onChange(uuid, options.find(option => option.value === uuid)?.label || "")} ariaLabel="Status kepegawaian" className="w-full" size="large" options={[{ value: "", label: "Pilih status kepegawaian" }, ...options]} />}
    {error && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </div>;
}
