import CarouselNavigation from "./CarouselNavigation";
import { useRef, useState } from "react";
import { formatIndonesianAcademicName } from "../utils/titleOptions";
import { formatTeacherStaffDate, formatTeacherStaffStatus } from "../utils/teacherStaffData";
import StatusBadge from "./StatusBadge";
import EmployeeStatusBadge from "./EmployeeStatusBadge";

const Field = ({ label, children, full = false, compact = false }) => <div className={`min-w-0 ${full ? "sm:col-span-2" : ""}`}><dt className={`${compact ? "mb-0.5" : "mb-1.5"} text-xs leading-5 text-slate-500 dark:text-slate-400`}>{label}</dt><dd className={`${compact ? "leading-5" : "leading-6"} whitespace-pre-wrap break-words text-sm font-medium text-slate-800 dark:text-slate-100 [overflow-wrap:anywhere]`}>{children || "—"}</dd></div>;
const ListField = ({ label, items }) => <Field label={label}>{items?.length ? <ul className="list-disc space-y-1 pl-5">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : null}</Field>;
const Group = ({ title, children }) => <section className="border-t border-slate-200 py-6 dark:border-white/10"><h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</h4>{children}</section>;
const SlideHeading = ({ title, description }) => <header className="mb-6"><h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3><p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p></header>;
const steps = ["Biodata", "Pendidikan", "Detail Pekerjaan"];


export default function TeacherStaffDetail({ data }) {
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
  return <div className="-mx-5 min-w-0 sm:-mx-7" role="region" aria-roledescription="carousel" aria-label="Detail guru dan staf">
    <CarouselNavigation labels={steps} active={activeSlide} onChange={goToSlide} ariaLabel="Pilih bagian detail" className="mb-5" insetClassName="px-5 sm:px-7" />
    <p className="sr-only" aria-live="polite">{steps[activeSlide]}, {activeSlide + 1} dari {steps.length}</p>
    <div ref={viewportRef} tabIndex={0} aria-label="Geser untuk melihat bagian lainnya" className="flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      onScroll={event => { const viewport = event.currentTarget; if (viewport.clientWidth) setActiveSlide(Math.max(0, Math.min(steps.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)))); }}
      onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); goToSlide(activeSlide + (event.key === "ArrowRight" ? 1 : -1)); } }}
      onPointerDown={event => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        const viewport = event.currentTarget;
        dragRef.current = { pointerId: event.pointerId, x: event.clientX, left: viewport.scrollLeft };
        viewport.style.scrollSnapType = "none";
        viewport.setPointerCapture(event.pointerId);
        event.preventDefault();
      }}
      onPointerMove={event => { const drag = dragRef.current; if (drag && drag.pointerId === event.pointerId) event.currentTarget.scrollLeft = drag.left + drag.x - event.clientX; }}
      onPointerUp={finishDrag} onPointerCancel={finishDrag}>
    <section aria-label="Biodata" aria-roledescription="slide" className="w-full min-w-0 shrink-0 snap-start px-5 pb-2 sm:px-7">
      <SlideHeading title="Biodata" description="Informasi pribadi dan kontak pegawai." />
      <div className="pb-6">
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Nama lengkap dan gelar</p>
        <p className="break-words text-2xl font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-100">{formatIndonesianAcademicName(data.name, data.title_prefixes, data.title_suffixes) || "—"}</p>
        {(data.title_prefixes?.length > 0 || data.title_suffixes?.length > 0) && <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Nama tanpa gelar: {data.name || "—"}</p>}
      </div>
      <Group title="Kontak">
        <dl className="grid gap-x-6 gap-y-5"><Field label="Email">{data.email}</Field><Field label="No. HP / WhatsApp">{data.phone}</Field><Field label="Status akun"><StatusBadge status={formatTeacherStaffStatus(data.status_user ?? data.status)} /></Field></dl>
      </Group>
      <Group title="Informasi pribadi">
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2"><Field label="Jenis kelamin" full>{data.gender}</Field><Field label="Tempat lahir">{data.birth_place}</Field><Field label="Tanggal lahir">{formatTeacherStaffDate(data.birth_date)}</Field><Field label="Alamat" full>{data.address}</Field></dl>
      </Group>
    </section>
    <section aria-label="Pendidikan" aria-roledescription="slide" className="w-full min-w-0 shrink-0 snap-start px-5 pb-2 sm:px-7">
      <SlideHeading title="Pendidikan" description="Riwayat jenjang dan institusi pendidikan." />
      <div className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-white/10 dark:border-white/10">
        {(data.educations || []).map((education, index) => <section key={index} className="py-4">
          {education.is_latest && <div className="mb-2"><span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300">Pendidikan terakhir</span></div>}
          <div className="text-base font-semibold leading-6 text-slate-800 dark:text-slate-100">{education.institution_name || "—"}</div>
          <div className="text-sm leading-6 text-slate-800 dark:text-slate-100">
            <span>{education.code || "Jenjang belum tersedia"}</span>{education.major && <><span className="mx-1.5 text-slate-400">—</span><span>{education.major}</span></>}
          </div>
          <div className="mt-2 flex flex-wrap items-start gap-x-5 gap-y-2">
            <Field compact label="Tahun masuk">{education.start_year}</Field><Field compact label="Tahun keluar">{education.end_year}</Field>
          </div>
        </section>)}
        {!data.educations?.length && <p className="py-8 text-sm text-slate-500 dark:text-slate-400">Belum ada riwayat pendidikan.</p>}
      </div>
    </section>
    <section aria-label="Detail Pekerjaan" aria-roledescription="slide" className="w-full min-w-0 shrink-0 snap-start px-5 pb-2 sm:px-7">
      <SlideHeading title="Detail Pekerjaan" description="Identitas kepegawaian dan penugasan di sekolah." />
      <Group title="Kepegawaian">
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label="Status kepegawaian" full><EmployeeStatusBadge status={data.employee_status} /></Field>
          <Field label="Tanggal bergabung">{formatTeacherStaffDate(data.join_date)}</Field>
          {data.resign_date && <Field label="Tanggal keluar">{formatTeacherStaffDate(data.resign_date)}</Field>}
        </dl>
      </Group>
      <Group title="Nomor identitas">
        <dl className="grid gap-5 tabular-nums"><Field label="NIK">{data.nik}</Field><Field label="NUPTK">{data.nuptk}</Field><Field label="NIP">{data.nip}</Field></dl>
      </Group>
      <Group title="Penugasan">
        <dl className="grid gap-5"><ListField label="Jabatan" items={data.positions?.length ? data.positions : data.position ? [data.position] : []} /><ListField label="Mata pelajaran" items={data.subject} /></dl>
      </Group>
    </section>
    </div>
  </div>;
}
