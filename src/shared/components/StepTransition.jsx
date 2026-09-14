export default function StepTransition({ phase, direction, onAnimationEnd, children }) {
  return <div className="wizard-content-viewport">
    <div className="wizard-content-motion" data-phase={phase} style={{ "--step-direction": direction }} onAnimationEnd={onAnimationEnd} aria-busy={phase !== "idle"} inert={phase !== "idle" ? "" : undefined}>
      {children}
    </div>
  </div>;
}
