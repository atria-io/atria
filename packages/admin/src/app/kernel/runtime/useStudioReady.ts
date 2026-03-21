import { useEffect, useMemo, useRef, useState } from "react";
import { applyRouteStyles } from "../styleManager.js";

interface UseStudioReadyOptions {
  basePath: string;
  styleFiles: string[];
  isLoading: boolean;
  isFinalizing: boolean;
  readyEventName: string;
}

/**
 * Emits the runtime-ready event only after route CSS has been applied and auth finalization is done.
 * Dispatch timing here controls when the host hides `atria-boot`, so early dispatch causes unstyled flashes.
 *
 * @param {UseStudioReadyOptions} options
 * @returns {void}
 */
export const useStudioReady = (options: UseStudioReadyOptions): void => {
  const { basePath, styleFiles, isLoading, isFinalizing, readyEventName } = options;
  const stableStyleFiles = useMemo(() => [...styleFiles], [styleFiles.join("|")]);
  const [areStylesReady, setAreStylesReady] = useState(false);
  const hasDispatchedReadyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setAreStylesReady(false);

    void applyRouteStyles(basePath, stableStyleFiles).finally(() => {
      if (!cancelled) {
        setAreStylesReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [basePath, stableStyleFiles]);

  useEffect(() => {
    if (isLoading || isFinalizing || !areStylesReady || hasDispatchedReadyRef.current) {
      return;
    }

    hasDispatchedReadyRef.current = true;
    window.dispatchEvent(new CustomEvent(readyEventName));
  }, [areStylesReady, isFinalizing, isLoading, readyEventName]);
};
