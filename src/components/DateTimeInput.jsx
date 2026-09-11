import { useEffect, useRef, useState } from "react";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";

// Controlled values: YYYY-MM-DD, HH:mm, or YYYY-MM-DDTHH:mm (local time).
// onChange receives the value string, matching DatePicker and Select.
export default function DateTimeInput({ type = "date", value = "", onChange, label, min, max, required, error, className = "", ...props }) {
  const [date, setDate] = useState(() => value.split("T")[0] || "");
  const [time, setTime] = useState(() => value.split("T")[1]?.slice(0, 5) || "");
  const emittedValue = useRef();
  const emit = (nextDate, nextTime) => {
    const next = nextDate && nextTime ? `${nextDate}T${nextTime}` : "";
    emittedValue.current = next;
    onChange(next);
  };
  useEffect(() => {
    if (value === emittedValue.current) return;
    setDate(value.split("T")[0] || "");
    setTime(value.split("T")[1]?.slice(0, 5) || "");
  }, [value]);
  if (type === "date") return <DatePicker {...props} value={value} onChange={onChange} label={label} min={min} max={max} required={required} error={error} className={className} />;
  if (type === "time") return <TimePicker {...props} value={value} onChange={onChange} label={label} min={min} max={max} required={required} error={error} className={className} />;
  return <fieldset className={`min-w-0 space-y-3 ${className}`}>
    <legend className="mb-2 text-sm font-semibold">{label}{required && <b className="text-rose-500"> *</b>}</legend>
    <DatePicker {...props} label="Tanggal" value={date} min={min?.split("T")[0]} max={max?.split("T")[0]} onChange={next => { setDate(next); emit(next, time); }} />
    <TimePicker disabled={props.disabled} label="Waktu" value={time} min={date === min?.split("T")[0] ? min?.split("T")[1] : undefined} max={date === max?.split("T")[0] ? max?.split("T")[1] : undefined} onChange={next => { setTime(next); emit(date, next); }} />
    {error && <span role="alert" className="block text-xs font-medium text-rose-600">{error}</span>}
  </fieldset>;
}
