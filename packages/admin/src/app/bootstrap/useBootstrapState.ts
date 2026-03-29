import { useEffect, useState } from "react";
import { getBootstrapState, type BootstrapState } from "./getBootstrapState.js";

export const useBootstrapState = (basePath: string): BootstrapState => {
  const [state, setState] = useState<BootstrapState>("setup");

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const result = await getBootstrapState(basePath);
      if (isActive) {
        setState(result.state);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [basePath]);

  return state;
};

