export const RUNTIME_FATAL_EVENT = "atria:runtime:fatal";

export interface RuntimeFatalDetail {
  message?: string;
}

export const getRuntimeFatalMessage = (event: Event): string | null => {
  const detail = (event as CustomEvent<RuntimeFatalDetail | undefined>).detail;
  if (!detail || typeof detail !== "object") {
    return null;
  }

  return typeof detail.message === "string" && detail.message.trim() !== "" ? detail.message : null;
};
