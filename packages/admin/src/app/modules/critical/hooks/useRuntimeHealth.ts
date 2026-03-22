import { useEffect, useState } from "react";
import { resolveBasePathUrl } from "../../../../state/api.client.js";
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
    let timeoutId: number | null = null;
    let abortController: AbortController | null = null;

    const clearTimers = (): void => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
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

      abortController = new AbortController();
      timeoutId = window.setTimeout(() => {
        abortController?.abort();
      }, heartbeatTimeoutMs);

      try {
        const response = await fetch(resolveBasePathUrl(basePath, serverHeartbeatPath), {
          credentials: "include",
          cache: "no-store",
          signal: abortController.signal
        });

        setRuntimeFlagReason(response.ok ? null : "server_unavailable");
      } catch {
        if (!cancelled) {
          setRuntimeFlagReason("server_unreachable");
        }
      } finally {
        abortController = null;
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      }

      if (!cancelled) {
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
      if (abortController) {
        abortController.abort();
      }
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [basePath, heartbeatDelayMs, heartbeatTimeoutMs, serverHeartbeatPath]);

  return runtimeFlagReason;
};
