import { useEffect, useState } from "react";
import { getBootstrapState, type BootstrapPayload } from "./getBootstrapState.js";

export const useBootstrapState = (basePath: string): BootstrapPayload => {
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>({ state: "setup" });

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const result = await getBootstrapState(basePath);
      if (isActive) {
        setBootstrap(result);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [basePath]);

  return bootstrap;
};
