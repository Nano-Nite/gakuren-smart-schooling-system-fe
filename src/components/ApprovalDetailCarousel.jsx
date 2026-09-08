import CarouselNavigation from "./CarouselNavigation";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ApprovalDetailCarousel({ children }) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const touch = useRef(null);
  const heading = useRef(null);
  const labels = ["Ringkasan", "Rincian"];
  const navigate = index => {
    const next = Math.max(0, Math.min(labels.length - 1, index));
    if (next === active) return;
    setDirection(next > active ? 1 : -1);
    setActive(next);
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "nearest" });
  };
  return <section aria-label="Detail approval" aria-roledescription="carousel" className="min-w-0">
    <CarouselNavigation labels={labels} active={active} onChange={navigate} ariaLabel="Bagian detail approval" topInset={20} className="mb-4" insetClassName="-mx-5 px-5" />
    <p ref={heading} tabIndex={-1} aria-live="polite" className="sr-only">{labels[active]}, {active + 1} dari {labels.length}</p>
    <div onTouchStart={event => {
      if (event.target.closest("input, textarea, button, a, select") || event.touches.length !== 1) { touch.current = null; return; }
      touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={event => {
      const start = touch.current;
      touch.current = null;
      if (!start || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(active + (dx < 0 ? 1 : -1));
    }}>
      {children.map((child, index) => <div key={labels[index]} hidden={active !== index} role="group" aria-roledescription="slide" aria-label={`${labels[index]}, ${index + 1} dari ${labels.length}`} className={active === index ? "approval-carousel-slide space-y-5" : ""} style={{ "--view-direction": direction }}>{child}</div>)}
    </div>
    <div className="mt-6 border-t border-slate-200 pt-4 dark:border-white/15"><button type="button" onClick={() => navigate(active === 0 ? 1 : 0)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-400/20 dark:bg-blue-400/5 dark:text-blue-300 dark:hover:bg-blue-400/10">{active === 1 && <ChevronLeft aria-hidden="true" className="h-4 w-4" />}{active === 0 ? "Lihat rincian pengajuan" : "Kembali ke ringkasan"}{active === 0 && <ChevronRight aria-hidden="true" className="h-4 w-4" />}</button></div>
  </section>;
}
