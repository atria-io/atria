import { useEffect, useState } from "react";
import { getBootstrapState, type BootstrapPayload } from "./getBootstrapState.js";
import { getRuntimeFatalMessage, RUNTIME_FATAL_EVENT } from "../runtime/runtimeFatal.js";

export type RuntimeBootstrapState = BootstrapPayload | { state: "critical"; message: string };

export const useBootstrapState = (basePath: string): RuntimeBootstrapState => {
  const [bootstrap, setBootstrap] = useState<RuntimeBootstrapState>({ state: "setup" });

  useEffect(() => {
    let isActive = true;

    const setCritical = (message: string): void => {
      if (isActive) {
        setBootstrap({ state: "critical", message });
      }
    };

    const handleRuntimeFatal = (event: Event): void => {
      setCritical(getRuntimeFatalMessage(event) ?? "Runtime failed. Retry to continue.");
    };

    window.addEventListener(RUNTIME_FATAL_EVENT, handleRuntimeFatal);

    void (async () => {
      try {
        const result = await getBootstrapState(basePath);
        if (isActive) {
          setBootstrap(result);
        }
      } catch {
        setCritical("Bootstrap request failed. Retry to continue.");
      }
    })();

    return () => {
      window.removeEventListener(RUNTIME_FATAL_EVENT, handleRuntimeFatal);
      isActive = false;
    };
  }, [basePath]);

  return bootstrap;
};
