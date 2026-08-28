import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const PageLoadingContext = createContext(null);
const MINIMUM_LOADING_TIME = 1000;

export function PageLoadingProvider({ children }) {
  const [isPageLoading, setIsPageLoading] = useState(false);
  const pendingTasks = useRef(0);
  const startedAt = useRef(0);
  const finishTimer = useRef(null);

  const startLoading = useCallback(() => {
    window.clearTimeout(finishTimer.current);
    if (pendingTasks.current === 0) {
      startedAt.current = Date.now();
      setIsPageLoading(true);
    }
    pendingTasks.current += 1;
  }, []);

  const stopLoading = useCallback(() => {
    pendingTasks.current = Math.max(0, pendingTasks.current - 1);
    if (pendingTasks.current > 0) return;
    const remaining = Math.max(0, MINIMUM_LOADING_TIME - (Date.now() - startedAt.current));
    finishTimer.current = window.setTimeout(() => setIsPageLoading(false), remaining);
  }, []);

  const value = useMemo(() => ({ isPageLoading, startLoading, stopLoading }), [isPageLoading, startLoading, stopLoading]);
  return <PageLoadingContext.Provider value={value}>{children}</PageLoadingContext.Provider>;
}

export const usePageLoading = () => {
  const context = useContext(PageLoadingContext);
  if (!context) throw new Error("usePageLoading must be used inside PageLoadingProvider");
  return context;
};
