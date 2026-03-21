import { useEffect, useRef, useState } from "react";
import { applyRouteStyles } from "../StyleManager.js";

interface UseStudioReadyOptions {
  basePath: string;
  styleFiles: string[];
  isLoading: boolean;
  isFinalizing: boolean;
  readyEventName: string;
}

export const useStudioReady = (options: UseStudioReadyOptions): void => {
  const { basePath, styleFiles, isLoading, isFinalizing, readyEventName } = options;
  const [areStylesReady, setAreStylesReady] = useState(false);
  const hasDispatchedReadyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setAreStylesReady(false);

    void applyRouteStyles(basePath, styleFiles).finally(() => {
      if (!cancelled) {
        setAreStylesReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [basePath, styleFiles]);

  useEffect(() => {
    if (isLoading || isFinalizing || !areStylesReady || hasDispatchedReadyRef.current) {
      return;
    }

    /**
     * Runtime bootstrap waits for this event to hide the loading overlay.
     * Dispatching early causes unstyled flashes; dispatching multiple times creates racey UI transitions.
     */
    hasDispatchedReadyRef.current = true;
    window.dispatchEvent(new CustomEvent(readyEventName));
  }, [areStylesReady, isFinalizing, isLoading, readyEventName]);
};
