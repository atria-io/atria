import { useEffect, useState } from "react";
import { getBootstrapState, type BootstrapPayload } from "./getBootstrapState.js";
import {
  getRuntimeFatalState,
  type RuntimeCriticalState,
  RUNTIME_FATAL_EVENT,
} from "../runtime/runtimeFatal.js";

export type RuntimeBootstrapState = BootstrapPayload | { state: "critical"; runtimeState: RuntimeCriticalState };

export const useBootstrapState = (basePath: string): RuntimeBootstrapState => {
  const [bootstrap, setBootstrap] = useState<RuntimeBootstrapState>({ state: "setup" });

  useEffect(() => {
    let isActive = true;

    const setCritical = (runtimeState: RuntimeCriticalState): void => {
      if (isActive) {
        setBootstrap({ state: "critical", runtimeState });
      }
    };

    const handleRuntimeFatal = (event: Event): void => {
      setCritical(getRuntimeFatalState(event));
    };

    window.addEventListener(RUNTIME_FATAL_EVENT, handleRuntimeFatal);

    void (async () => {
      try {
        const result = await getBootstrapState(basePath);
        if (isActive) {
          setBootstrap(result);
        }
      } catch {
        if (!window.navigator.onLine) {
          setCritical({ kind: "offline" });
          return;
        }

        setCritical({ kind: "server-down" });
      }
    })();

    return () => {
      window.removeEventListener(RUNTIME_FATAL_EVENT, handleRuntimeFatal);
      isActive = false;
    };
  }, [basePath]);

  return bootstrap;
};
