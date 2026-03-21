import { useEffect, useState } from "react";

export type ColorScheme = "light" | "dark";
export type ColorSchemePreference = "system" | ColorScheme;

declare global {
  interface Window {
    __ATRIA_INITIAL_SCHEME?: string;
  }
}

interface UseColorSchemeOptions {
  storageKey: string;
}

interface UseColorSchemeResult {
  colorScheme: ColorScheme;
  colorSchemePreference: ColorSchemePreference;
  setColorSchemePreference: (scheme: ColorSchemePreference) => void;
}

const parseColorSchemePreference = (
  value: string | null | undefined
): ColorSchemePreference | null => {
  if (value === "system" || value === "light" || value === "dark") {
    return value;
  }

  return null;
};

const resolveSystemColorScheme = (): ColorScheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const resolveInitialColorSchemePreference = (storageKey: string): ColorSchemePreference => {
  try {
    const stored = parseColorSchemePreference(localStorage.getItem(storageKey));
    if (stored) {
      return stored;
    }
  } catch (_error) {}

  return "system";
};

export const useColorScheme = (options: UseColorSchemeOptions): UseColorSchemeResult => {
  const { storageKey } = options;
  const [colorSchemePreference, setColorSchemePreference] = useState<ColorSchemePreference>(() =>
    resolveInitialColorSchemePreference(storageKey)
  );
  const [systemColorScheme, setSystemColorScheme] = useState<ColorScheme>(resolveSystemColorScheme);
  const colorScheme = colorSchemePreference === "system" ? systemColorScheme : colorSchemePreference;

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, colorSchemePreference);
    } catch (_error) {}
  }, [colorSchemePreference, storageKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent): void => {
      setSystemColorScheme(event.matches ? "dark" : "light");
    };

    setSystemColorScheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", onChange);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    window.__ATRIA_INITIAL_SCHEME = colorScheme;
  }, [colorScheme]);

  return {
    colorScheme,
    colorSchemePreference,
    setColorSchemePreference
  };
};
