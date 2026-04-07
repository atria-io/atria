import { useEffect, useState } from "react";
import { getAppState } from "./getAppState.js";
import { getRuntimeFatalState, RUNTIME_FATAL_EVENT } from "../runtimeFatal.js";
import type { AppState, CriticalScreen } from "../runtimeTypes.js";

const isSameAppState = (left: AppState | null, right: AppState): boolean => {
  if (!left || left.realm !== right.realm || left.screen !== right.screen) {
    return false;
  }

  if (left.realm !== "studio" || right.realm !== "studio") {
    return true;
  }

  return (
    left.user.name === right.user.name &&
    left.user.email === right.user.email &&
    left.user.avatarUrl === right.user.avatarUrl &&
    left.user.role === right.user.role
  );
};

export const useAppState = (basePath: string, initialAppState?: AppState): AppState | null => {
  const [appState, setAppState] = useState<AppState | null>(initialAppState ?? null);

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
          setAppState((current) => (isSameAppState(current, nextAppState) ? current : nextAppState));
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
