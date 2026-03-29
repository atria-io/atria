import { useEffect, useState } from "react";
import { getBootstrapState } from "./getBootstrapState.js";
import { getRuntimeFatalState, RUNTIME_FATAL_EVENT } from "../runtime/runtimeFatal.js";
import type { AppState, CriticalScreen } from "../runtime/runtimeTypes.js";

export const useBootstrapState = (basePath: string): AppState => {
  const [appState, setAppState] = useState<AppState>({ realm: "auth", screen: "setup" });

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
        const bootstrapState = await getBootstrapState(basePath);
        if (isActive) {
          if (bootstrapState.state === "authenticated") {
            if (!bootstrapState.user) {
              setAppState({ realm: "auth", screen: "login" });
              return;
            }

            setAppState({ realm: "studio", screen: "dashboard", user: bootstrapState.user });
            return;
          }

          setAppState({ realm: "auth", screen: bootstrapState.state });
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

  return appState;
};
