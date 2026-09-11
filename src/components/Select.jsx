import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

// Default dropdown: keep visual styles in index.css (.dropdown-*).
// Use className for layout; add a separate visual variant only when explicitly requested.
export default function Select({ value, options, onChange, ariaLabel, placement = "bottom", className = "", size = "default", disabled = false, id, onBlur, renderOption, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) {
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
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const resolvedPlacement = placement === "top" || (placement === "bottom" && spaceBelow < 240 && spaceAbove > spaceBelow) ? "top" : "bottom";
    const availableHeight = resolvedPlacement === "top" ? spaceAbove - 6 : spaceBelow - 6;
    setMenuStyle(placement === "top"
      ? { bottom: window.innerHeight - rect.top + 6, left: Math.max(8, left), width, maxHeight: Math.max(120, availableHeight) }
      : resolvedPlacement === "top"
        ? { bottom: window.innerHeight - rect.top + 6, left: Math.max(8, left), width, maxHeight: Math.max(120, availableHeight) }
        : { top: rect.bottom + 6, left: Math.max(8, left), width, maxHeight: Math.max(120, availableHeight) });
  }, [placement]);

  useLayoutEffect(() => { if (open) updatePosition(); }, [open, updatePosition]);
  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => { window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); };
  }, [open, updatePosition]);

  const handleKeyDown = event => {
    if (disabled || !normalized.length) return;
    if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (!open) return setOpen(true);
    if (["Enter", " "].includes(event.key)) return;
    const current = normalized.findIndex(option => option.value === value);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const next = (current + direction + normalized.length) % normalized.length;
    onChange(normalized[next].value);
  };

  const Trigger = renderOption ? "div" : "button";
  const Option = renderOption ? "div" : "button";
  return <div ref={rootRef} className={`relative ${className}`}>
    <Trigger role={renderOption ? "button" : undefined} tabIndex={renderOption ? (disabled ? -1 : 0) : undefined} aria-disabled={disabled} ref={buttonRef} id={id} disabled={disabled} onBlur={onBlur} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => { if (!disabled) setOpen(state => !state); }} onKeyDown={handleKeyDown} className={`dropdown-trigger ${renderOption ? "dropdown-trigger--rich" : size === "large" ? "dropdown-trigger--large" : ""}`}><span data-placeholder={selected?.value === "" ? "true" : undefined} className="min-w-0 truncate">{renderOption && selected ? renderOption(selected) : selected?.label}</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} /></Trigger>
    {open && !disabled && createPortal(<div ref={menuRef} role="listbox" style={menuStyle} className="dropdown-menu fixed z-[100] overflow-y-auto overscroll-contain animate-[fadeUp_150ms_ease-out]">
      {normalized.map((option, index) => { const active = String(option.value) === String(value); return <Fragment key={option.value}>{option.group && option.group !== normalized[index - 1]?.group && <div role="presentation" className={`${index > 0 ? "mt-1.5 border-t border-slate-200 pt-3 dark:border-white/10" : "pt-1.5"} px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400`}>{option.group}</div>}<Option tabIndex={renderOption ? 0 : undefined} onKeyDown={event => { if (renderOption && ["Enter", " "].includes(event.key)) { event.preventDefault(); onChange(option.value); setOpen(false); } }} type="button" role="option" title={option.title} aria-selected={active} onClick={() => { onChange(option.value); setOpen(false); }} className="dropdown-option"><span className="min-w-0 truncate">{renderOption ? renderOption(option) : option.label}</span>{active && <Check className="h-4 w-4 shrink-0" />}</Option></Fragment>; })}
    </div>, document.body)}
  </div>;
}
