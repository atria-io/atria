import * as React from "react";
import { getAppState } from "./fetch.app.state.js";
import { fatal } from "@/app/system/hooks/fatal.js";
import { popstate } from "@/app/system/hooks/popstate.js";
import type { State } from "../../realms/critical/model/critical.types.js";
import type { AppState } from "../state/app.state.js";

const isSameAppState = (
  left: AppState | null, right: AppState
): boolean => {
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

export const useAppState = (
  basePath: string, initialAppState?: AppState
): AppState | null => {
  const [appState, setAppState] = React.useState<AppState | null>(initialAppState ?? null);
  const syncAppStateRef = React.useRef<() => Promise<void>>(async () => undefined);

  React.useEffect(() => {
    let isActive = true;

    const syncAppState = async (): Promise<void> => {
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
    };
    syncAppStateRef.current = syncAppState;

    const setCritical = (screen: State): void => {
      if (isActive) {
        setAppState({ realm: "critical", screen });
      }
    };

    const handleRuntimeFatal = (event: Event): void => {
      setCritical(fatal(event));
    };

    window.addEventListener("atria:runtime:fatal", handleRuntimeFatal);

    if (initialAppState === undefined) {
      void syncAppState();
    }

    return () => {
      window.removeEventListener("atria:runtime:fatal", handleRuntimeFatal);
      isActive = false;
    };
  }, [basePath, initialAppState]);

  popstate(() => {
    void syncAppStateRef.current();
  });

  return appState;
};
