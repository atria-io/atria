import { useEffect, useState } from "react";
import { useScheme as useResolvedScheme } from "../../hooks/useScheme.js";
import type {
  RuntimeScheme,
  SchemeMode,
  UseSchemeResult,
} from "./schemeTypes.js";

const SCHEME_MODES: readonly SchemeMode[] = ["system", "dark", "light"];

const getRuntimeScheme = (): RuntimeScheme | null => {
  const runtimeScheme = (
    window as { __atria__?: { scheme?: Partial<RuntimeScheme> } }
  ).__atria__?.scheme;

  if (!runtimeScheme) {
    return null;
  }

  if (
    (runtimeScheme.mode !== "system" && runtimeScheme.mode !== "light" && runtimeScheme.mode !== "dark") ||
    typeof runtimeScheme.setMode !== "function"
  ) {
    return null;
  }

  return runtimeScheme as RuntimeScheme;
};

const readRuntimeMode = (): SchemeMode => getRuntimeScheme()?.mode ?? "system";

export const useScheme = (): UseSchemeResult => {
  const resolved = useResolvedScheme();
  const [mode, setCurrentMode] = useState<SchemeMode>(() => readRuntimeMode());

  useEffect(() => {
    setCurrentMode(readRuntimeMode());
  }, [resolved]);

  const setMode = (nextMode: SchemeMode): void => {
    getRuntimeScheme()?.setMode(nextMode);
    setCurrentMode(readRuntimeMode());
  };

  return {
    mode,
    resolved,
    modes: SCHEME_MODES,
    setMode,
  };
};
