import { useEffect, useState } from "react";
import { getAppState } from "./getAppState.js";
import { getRuntimeFatalState, RUNTIME_FATAL_EVENT } from "../runtime/runtimeFatal.js";
import type { AppState, CriticalScreen } from "../runtime/runtimeTypes.js";

export const useAppState = (basePath: string, initialAppState?: AppState): AppState => {
  const [appState, setAppState] = useState<AppState>(
    initialAppState ?? { realm: "auth", screen: "setup" }
  );

  useEffect(() => {
    let isActive = true;

    const setCritical = (screen: CriticalScreen): void => {
      if (isActive) {
        setAppState({ realm: "critical", screen });
      }
    };

    const handleRuntimeFatal = (event: Event): void => {
      setCritical(getRuntimeFatalState(event));
    };

    window.addEventListener(RUNTIME_FATAL_EVENT, handleRuntimeFatal);

    void (async () => {
      try {
        const nextAppState = await getAppState(basePath);
        if (isActive) {
          setAppState(nextAppState);
        }
      } catch {
        if (!window.navigator.onLine) {
          setCritical("offline");
          return;
        }

        setCritical("server-down");
      }
    })();

    return () => {
      window.removeEventListener(RUNTIME_FATAL_EVENT, handleRuntimeFatal);
      isActive = false;
    };
  }, [basePath]);

  return appState;
};
