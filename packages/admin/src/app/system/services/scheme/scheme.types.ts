export type SchemeMode = "system" | "light" | "dark";

export interface RuntimeScheme {
  mode: SchemeMode;
  setMode: (mode: SchemeMode) => void;
}

export interface UseSchemeResult {
  mode: SchemeMode;
  resolved: "light" | "dark";
  modes: readonly SchemeMode[];
  setMode: (mode: SchemeMode) => void;
}
