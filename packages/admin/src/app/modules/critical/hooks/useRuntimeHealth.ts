import { useEffect, useState } from "react";
import { resolveBasePathUrl } from "../../../../state/api.client.js";
import type { CriticalStatusReason } from "../CriticalStatusView.js";

interface UseRuntimeHealthOptions {
  basePath: string;
  serverHeartbeatPath: string;
  heartbeatDelayMs: number;
  heartbeatTimeoutMs: number;
}

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

    const handleOnline = (): void => {
      clearTimers();
      void checkServerHeartbeat();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    void checkServerHeartbeat();

    return () => {
      cancelled = true;
      clearTimers();
      if (abortController) {
        abortController.abort();
      }
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [basePath, heartbeatDelayMs, heartbeatTimeoutMs, serverHeartbeatPath]);

  return runtimeFlagReason;
};
