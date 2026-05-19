import { useSyncExternalStore } from "react";

interface CatalogFilterState {
  archivedOnly: boolean;
}

let state: CatalogFilterState = {
  archivedOnly: false,
};

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

const getSnapshot = (): CatalogFilterState => state;

const setState = (next: Partial<CatalogFilterState>): void => {
  state = { ...state, ...next };
  emit();
};

export const useCatalogFilterState = (): CatalogFilterState =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const toggleArchivedOnly = (): void => {
  setState({ archivedOnly: !state.archivedOnly });
};

export const closeArchivedOnly = (): void => {
  if (!state.archivedOnly) {
    return;
  }

  setState({ archivedOnly: false });
};
