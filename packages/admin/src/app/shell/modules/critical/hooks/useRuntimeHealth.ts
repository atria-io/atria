import { useEffect, useState } from "react";
import { resolveBasePathUrl } from "../../../../../state/api.client.js";
import type { CriticalStatusReason } from "../CriticalStatusView.js";

interface UseRuntimeHealthOptions {
  basePath: string;
  serverHeartbeatPath: string;
  heartbeatDelayMs: number;
  heartbeatTimeoutMs: number;
}

/**
 * Runtime liveness probe for the critical screen.
 * Merges browser offline events with heartbeat results
 * into a single reason code for UI routing.
 */
export const useRuntimeHealth = (options: UseRuntimeHealthOptions): CriticalStatusReason | null => {
  const { basePath, serverHeartbeatPath, heartbeatDelayMs, heartbeatTimeoutMs } = options;
  const [runtimeFlagReason, setRuntimeFlagReason] = useState<CriticalStatusReason | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | null = null;
    let activeController: AbortController | null = null;
    let activeRequestId = 0;

    const isAbortError = (error: unknown): boolean => {
      if (error instanceof DOMException) {
        return error.name === "AbortError";
      }

      if (typeof error !== "object" || error === null || !("name" in error)) {
        return false;
      }

      return (error as { name?: unknown }).name === "AbortError";
    };

    const clearTimers = (): void => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };

    const scheduleHeartbeat = (delayMs: number): void => {
      if (cancelled) {
        return;
      }

      timerId = window.setTimeout(() => {
        void checkServerHeartbeat();
      }, delayMs);
    };

    const checkServerHeartbeat = async (): Promise<void> => {
      if (cancelled) {
        return;
      }

      if (!window.navigator.onLine) {
        setRuntimeFlagReason("network_offline");
        scheduleHeartbeat(heartbeatDelayMs);
        return;
      }

      if (activeController) {
        activeController.abort();
      }

      const requestId = activeRequestId + 1;
      activeRequestId = requestId;
      const requestController = new AbortController();
      activeController = requestController;
      let didTimeout = false;
      const timeoutId = window.setTimeout(() => {
        didTimeout = true;
        requestController.abort();
      }, heartbeatTimeoutMs);

      try {
        const response = await fetch(resolveBasePathUrl(basePath, serverHeartbeatPath), {
          credentials: "include",
          cache: "no-store",
          signal: requestController.signal
        });

        if (!cancelled && requestId === activeRequestId) {
          setRuntimeFlagReason(response.ok ? null : "server_unavailable");
        }
      } catch (error) {
        if (!cancelled && requestId === activeRequestId) {
          if (didTimeout || !isAbortError(error)) {
            setRuntimeFlagReason("server_unreachable");
          }
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (activeController === requestController) {
          activeController = null;
        }
      }

      if (!cancelled && requestId === activeRequestId) {
        scheduleHeartbeat(heartbeatDelayMs);
      }
    };

    const handleOffline = (): void => {
      setRuntimeFlagReason("network_offline");
    };

    const triggerImmediateCheck = (): void => {
      clearTimers();
      void checkServerHeartbeat();
    };

    const handleOnline = (): void => {
      triggerImmediateCheck();
    };

    const handleFocus = (): void => {
      if (document.visibilityState !== "visible") {
        return;
      }

      triggerImmediateCheck();
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState !== "visible") {
        return;
      }

      triggerImmediateCheck();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    void checkServerHeartbeat();

    return () => {
      cancelled = true;
      clearTimers();
      if (activeController) {
        activeController.abort();
      }
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [basePath, heartbeatDelayMs, heartbeatTimeoutMs, serverHeartbeatPath]);

  return runtimeFlagReason;
};
