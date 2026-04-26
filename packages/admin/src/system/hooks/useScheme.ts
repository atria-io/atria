import { useEffect, useState } from "react";

type ResolvedScheme = "light" | "dark";

interface RuntimeScheme {
  resolved?: string;
  subscribe?: (onChange: (resolved: ResolvedScheme) => void) => (() => void) | void;
}

interface RuntimeAtria {
  scheme?: RuntimeScheme;
}

declare global {
  interface Window {
    __atria__?: RuntimeAtria;
  }
}

const readResolvedScheme = (): ResolvedScheme => {
  const resolved = window.__atria__?.scheme?.resolved;
  return resolved === "dark" ? "dark" : "light";
};

export const useRuntimeScheme = (): ResolvedScheme => {
  const [resolved, setResolved] = useState<ResolvedScheme>(() => readResolvedScheme());

  useEffect(() => {
    setResolved(readResolvedScheme());

    const subscribe = window.__atria__?.scheme?.subscribe;
    if (typeof subscribe !== "function") {
      return;
    }

    const unsubscribe = subscribe((nextResolved) => {
      setResolved(nextResolved === "dark" ? "dark" : "light");
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  return resolved;
};
