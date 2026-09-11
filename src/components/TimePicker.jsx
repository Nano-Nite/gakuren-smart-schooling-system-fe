import Select from "./Select";

const pad = value => String(value).padStart(2, "0");

export default function TimePicker({ value = "", onChange, label = "Waktu", required = false, error, min, max, disabled = false, className = "" }) {
  const [hour = "", minute = ""] = value.split(":");
  const allowed = time => (!min || time >= min.slice(0, 5)) && (!max || time <= max.slice(0, 5));
  const minutesFor = selectedHour => Array.from({ length: 60 }, (_, index) => pad(index)).filter(item => allowed(`${selectedHour}:${item}`));
  const hours = Array.from({ length: 24 }, (_, index) => pad(index)).filter(item => minutesFor(item).length);
  return <fieldset disabled={disabled} className={`min-w-0 text-sm ${className}`}>
    <legend className="mb-2 font-semibold">{label}{required && <b className="text-rose-500"> *</b>}</legend>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <Select size="large" disabled={disabled} value={hour} ariaLabel={`${label}: jam`} aria-invalid={Boolean(error)} options={[{ value: "", label: "Jam" }, ...hours]} onChange={next => onChange(next ? `${next}:${minutesFor(next).includes(minute) ? minute : minutesFor(next)[0]}` : "")} />
      <span aria-hidden="true">:</span>
      <Select size="large" disabled={disabled || !hours.includes(hour)} value={minute} ariaLabel={`${label}: menit`} aria-invalid={Boolean(error)} options={[{ value: "", label: "Menit" }, ...minutesFor(hour)]} onChange={next => onChange(next ? `${hour}:${next}` : "")} />
    </div>
    {error && <span role="alert" className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
  </fieldset>;
}
