import * as React from "react";

interface State {
  archivedOnly: boolean;
  searchTerm: string;
}

const STORAGE_KEY = "atria:archived";

let state: State = {
  archivedOnly: false,
  searchTerm: "",
};
let hydrated = false;

const listeners = new Set<() => void>();

const emit = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = (): State => state;

const setState = (next: Partial<State>): void => {
  state = { ...state, ...next };
  emit();
};

const readArchive = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === "true";
};

const writeArchive = (value: boolean): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
};

const clearArchive = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
};

export const use = (): State =>
  React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const setArchived = (next?: boolean): void => {
  const archivedOnly = next ?? !state.archivedOnly;

  if (state.archivedOnly === archivedOnly) {
    return;
  }

  setState({ archivedOnly });
  writeArchive(archivedOnly);
};

export const setSearch = (next: string): void => {
  if (state.searchTerm === next) {
    return;
  }

  setState({ searchTerm: next });
};

export const syncScope = (pathname: string): void => {
  const inPages = pathname.startsWith("/pages");
  if (!inPages) {
    hydrated = false;
    clearArchive();
    if (state.archivedOnly) {
      setState({ archivedOnly: false });
    }
    return;
  }

  if (hydrated) {
    return;
  }
  hydrated = true;
  const archivedOnly = readArchive();
  if (state.archivedOnly !== archivedOnly) {
    setState({ archivedOnly });
  }
};

export const setArchive = setArchived;
export const setSearchTerm = setSearch;
export const syncArchiveScope = syncScope;
