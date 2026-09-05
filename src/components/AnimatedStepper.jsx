import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

export default function AnimatedStepper({ steps, activeStep, disabled, onStepChange }) {
  const [timelineStep, setTimelineStep] = useState(activeStep);
  const timelineRef = useRef(null);
  const waiting = timelineStep !== activeStep;

  useEffect(() => {
    if (timelineStep === activeStep) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) { setTimelineStep(activeStep); return undefined; }
    // Hold the complete previous timeline state before changing its target.
    const pause = timelineRef.current.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 500 });
    let cancelled = false;
    pause.finished.then(() => { if (!cancelled) setTimelineStep(activeStep); }).catch(() => { /* Navigation or unmount cancelled the pause. */ });
    return () => { cancelled = true; pause.cancel(); };
  }, [activeStep, timelineStep]);

  return <nav ref={timelineRef} aria-label="Tahapan formulir" className="wizard-timeline mb-6">
    <ol className="wizard-timeline-track" style={{ "--active-index": timelineStep - 1 }}>
      {steps.map((label, index) => {
        const number = index + 1;
        const completed = number < timelineStep;
        const active = number === timelineStep;
        return <li key={label} className="wizard-timeline-item" data-state={active ? "active" : completed ? "completed" : "upcoming"}>
          {index < steps.length - 1 && <div aria-hidden="true" className="wizard-connector bg-slate-100 dark:bg-white/10"><span className="bg-emerald-600 dark:bg-emerald-500" style={{ transform: `scaleX(${completed ? 1 : 0})` }} /></div>}
          <button type="button" aria-current={active ? "step" : undefined} aria-label={`Langkah ${number}: ${label}${completed ? ", selesai" : active ? ", aktif" : ", berikutnya"}`} disabled={disabled || waiting || number > activeStep} onClick={() => onStepChange(number)} className="relative z-10 flex w-full flex-col items-center gap-3 rounded-lg py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-default">
            <span className={`wizard-timeline-node relative grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${active ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-500/10" : completed ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-200"}`}>
              <span className="wizard-node-number" aria-hidden="true">{number}</span><Check aria-hidden="true" className="wizard-node-check absolute h-4 w-4" />
            </span>
            <span className={`wizard-timeline-label text-[11px] ${active ? "font-semibold text-blue-700 dark:text-blue-300" : "font-medium text-slate-500 dark:text-slate-400"}`}>{label}</span>
          </button>
        </li>;
      })}
    </ol>
  </nav>;
}
