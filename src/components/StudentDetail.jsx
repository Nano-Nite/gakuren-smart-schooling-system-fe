import CarouselNavigation from "./CarouselNavigation";
import { useRef, useState } from "react";
import StatusBadge from "./StatusBadge";

const Field = ({ label, children, full = false }) => <div className={`min-w-0 ${full ? "sm:col-span-2" : ""}`}><dt className="mb-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-800 dark:text-slate-100 [overflow-wrap:anywhere]">{children || "—"}</dd></div>;
const Group = ({ title, children }) => <section className="border-t border-slate-200 py-5 dark:border-white/10"><h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</h4>{children}</section>;
const SlideHeading = ({ title, description }) => <header className="mb-6"><h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3><p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p></header>;
const steps = ["Biodata", "Orang tua/wali"];

export default function StudentDetail({ data }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const goToSlide = index => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const target = Math.max(0, Math.min(steps.length - 1, index));
    viewport.scrollTo({ left: target * viewport.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const finishDrag = event => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    const viewport = viewportRef.current;
    viewport.style.scrollSnapType = "";
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    goToSlide(Math.round(viewport.scrollLeft / viewport.clientWidth));
  };
  return <div className="-mx-5 min-w-0 sm:-mx-7" role="region" aria-roledescription="carousel" aria-label="Detail siswa">
    <CarouselNavigation labels={steps} active={activeSlide} onChange={goToSlide} ariaLabel="Pilih bagian detail" className="mb-5" insetClassName="px-5 sm:px-7" />
    <p className="sr-only" aria-live="polite">{steps[activeSlide]}, {activeSlide + 1} dari {steps.length}</p>
    <div ref={viewportRef} tabIndex={0} aria-label="Geser untuk melihat bagian lainnya" className="flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      onScroll={event => { const viewport = event.currentTarget; if (viewport.clientWidth) setActiveSlide(Math.max(0, Math.min(steps.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)))); }}
      onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); goToSlide(activeSlide + (event.key === "ArrowRight" ? 1 : -1)); } }}
      onPointerDown={event => { if (event.pointerType !== "mouse" || event.button !== 0) return; const viewport = event.currentTarget; dragRef.current = { pointerId: event.pointerId, x: event.clientX, left: viewport.scrollLeft }; viewport.style.scrollSnapType = "none"; viewport.setPointerCapture(event.pointerId); event.preventDefault(); }}
      onPointerMove={event => { const drag = dragRef.current; if (drag && drag.pointerId === event.pointerId) event.currentTarget.scrollLeft = drag.left + drag.x - event.clientX; }}
      onPointerUp={finishDrag} onPointerCancel={finishDrag}>
      <section aria-label="Biodata" aria-roledescription="slide" className="w-full min-w-0 shrink-0 snap-start px-5 pb-2 sm:px-7">
        <SlideHeading title="Biodata" description="Informasi pribadi dan kontak siswa." />
        <div className="pb-5"><p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Nama siswa</p><p className="break-words text-2xl font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-100">{data.name || "—"}</p></div>
        <Group title="Identitas"><dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2"><Field label="NIS">{data.nis}</Field><Field label="NISN">{data.nisn}</Field><Field label="Jenis kelamin">{data.gender}</Field><Field label="Kelas">{data.class_name}</Field><Field label="Status"><StatusBadge status={data.status} /></Field><Field label="Status Siswa"><StatusBadge status={data.student_status} className="max-w-full !whitespace-normal break-words text-center" /></Field></dl></Group>
        <Group title="Kontak"><dl className="grid gap-x-6 gap-y-5"><Field label="Email siswa">{data.email}</Field><Field label="No. HP / WhatsApp">{data.phone}</Field><Field label="Alamat siswa">{data.address}</Field></dl></Group>
      </section>
      <section aria-label="Orang tua atau wali" aria-roledescription="slide" className="w-full min-w-0 shrink-0 snap-start px-5 pb-2 sm:px-7">
        <SlideHeading title="Orang tua/wali" description="Informasi kontak orang tua atau wali siswa." />
        <Group title="Kontak orang tua/wali"><dl className="grid gap-x-6 gap-y-5"><Field label="Nama orang tua/wali">{data.parent_name}</Field><Field label="Email orang tua/wali">{data.parent_email}</Field><Field label="No. HP / WhatsApp">{data.parent_phone}</Field><Field label="Alamat orang tua/wali">{data.parent_address}</Field></dl></Group>
      </section>
    </div>
  </div>;
}
