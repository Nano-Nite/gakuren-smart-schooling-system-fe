import { useEffect, useRef, useState } from "react";

export default function useStepTransition(enabled) {
  const [state, setState] = useState({ target: 1, displayed: 1, phase: "idle", direction: 1 });
  const locked = useRef(false);
  const headingRef = useRef(null);
  const focusPending = useRef(false);

  useEffect(() => {
    if (!enabled) {
      locked.current = false;
      focusPending.current = false;
      setState({ target: 1, displayed: 1, phase: "idle", direction: 1 });
    }
  }, [enabled]);

  useEffect(() => {
    if (state.phase === "idle" && focusPending.current) {
      focusPending.current = false;
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [state.phase]);

  const navigate = next => {
    if (locked.current) return;
    const target = typeof next === "function" ? next(state.target) : next;
    if (target === state.target) return;
    locked.current = true;
    setState(current => ({ ...current, target, direction: target > current.displayed ? 1 : -1, phase: "exit" }));
  };

  const onAnimationEnd = event => {
    if (event.target !== event.currentTarget) return;
    if (state.phase === "exit") {
      setState(current => ({ ...current, displayed: current.target, phase: "enter" }));
    } else if (state.phase === "enter") {
      locked.current = false;
      focusPending.current = true;
      setState(current => ({ ...current, phase: "idle" }));
    }
  };

  return { createStep: state.target, displayedStep: state.displayed, setCreateStep: navigate, transitioning: state.phase !== "idle", headingRef, phase: state.phase, direction: state.direction, onAnimationEnd };
}
