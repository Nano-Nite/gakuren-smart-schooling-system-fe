export default function CarouselNavigation({
  labels,
  active,
  onChange,
  ariaLabel = "Pilih bagian",
  className = "",
  topInset = 24,
  insetClassName = "-mx-5 px-5 sm:-mx-7 sm:px-7",
}) {
  return (
    <div
      style={{ top: -topInset, marginTop: -topInset }}
      className={`sticky z-20 py-2 bg-white/40 backdrop-blur-xl dark:bg-[color-mix(in_srgb,var(--mui-paper)_40%,transparent)] ${insetClassName} ${className}`}>
      <nav
        aria-label={ariaLabel}
        className="flex gap-1 rounded-xl bg-slate-200/40 p-1 dark:bg-slate-700/30">
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-current={active === index ? "step" : undefined}
            onClick={() => onChange(index)}
            className={`min-h-11 min-w-0 flex-1 rounded-lg px-2 py-3 text-xs font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active === index ? "bg-white/65 text-blue-700 shadow-sm dark:bg-slate-500/35 dark:text-blue-300" : "text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/5"}`}>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
