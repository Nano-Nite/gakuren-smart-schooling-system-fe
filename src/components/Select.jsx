import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export default function Select({ value, options, onChange, ariaLabel, placement = "bottom", className = "" }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const normalized = options.map(option => typeof option === "string" ? { value: option, label: option } : option);
  const selected = normalized.find(option => String(option.value) === String(value)) || normalized[0];

  useEffect(() => {
    const closeOnOutsidePress = event => {
      if (rootRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key !== "Escape" || !open) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePress, true);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress, true);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [open]);

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(rect.width, 176);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    setMenuStyle(placement === "top"
      ? { bottom: window.innerHeight - rect.top + 6, left: Math.max(8, left), width }
      : { top: rect.bottom + 6, left: Math.max(8, left), width });
  }, [placement]);

  useLayoutEffect(() => { if (open) updatePosition(); }, [open, updatePosition]);
  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => { window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); };
  }, [open, updatePosition]);

  const handleKeyDown = event => {
    if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (!open) return setOpen(true);
    if (["Enter", " "].includes(event.key)) return;
    const current = normalized.findIndex(option => option.value === value);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const next = (current + direction + normalized.length) % normalized.length;
    onChange(normalized[next].value);
  };

  return <div ref={rootRef} className={`relative ${className}`}>
    <button ref={buttonRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(state => !state)} onKeyDown={handleKeyDown} className="flex h-10 min-w-0 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 shadow-sm hover:border-blue-300 focus-visible:border-blue-500"><span className="min-w-0 truncate">{selected?.label}</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} /></button>
    {open && createPortal(<div ref={menuRef} role="listbox" style={menuStyle} className="fixed z-[100] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-[fadeUp_150ms_ease-out]">
      {normalized.map(option => { const active = String(option.value) === String(value); return <button key={option.value} type="button" role="option" aria-selected={active} onClick={() => { onChange(option.value); setOpen(false); }} className={`flex w-full items-center justify-between gap-4 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${active ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}><span>{option.label}</span>{active && <Check className="h-4 w-4" />}</button>; })}
    </div>, document.body)}
  </div>;
}
