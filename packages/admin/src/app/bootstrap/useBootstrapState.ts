import { useEffect, useState } from "react";
import { getBootstrapState, type BootstrapPayload } from "./getBootstrapState.js";

export type RuntimeBootstrapState = BootstrapPayload | { state: "critical" };

export const useBootstrapState = (basePath: string): RuntimeBootstrapState => {
  const [bootstrap, setBootstrap] = useState<RuntimeBootstrapState>({ state: "setup" });

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        const result = await getBootstrapState(basePath);
        if (isActive) {
          setBootstrap(result);
        }
      } catch {
        if (isActive) {
          setBootstrap({ state: "critical" });
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [basePath]);

  return bootstrap;
};
