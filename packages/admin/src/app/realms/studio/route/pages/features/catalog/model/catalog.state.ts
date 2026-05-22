import * as React from "react";

interface FilterState {
  archivedOnly: boolean;
}

let state: FilterState = {
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

const getSnapshot = (): FilterState => state;

const setState = (next: Partial<FilterState>): void => {
  state = { ...state, ...next };
  emit();
};

export const useFilter = (): FilterState =>
  React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const setArchived = (next?: boolean): void => {
  const archivedOnly = next ?? !state.archivedOnly;

  if (state.archivedOnly === archivedOnly) {
    return;
  }

  setState({ archivedOnly });
};
