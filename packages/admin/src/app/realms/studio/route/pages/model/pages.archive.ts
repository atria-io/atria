import * as React from "react";

interface State {
  archivedOnly: boolean;
  searchTerm: string;
}

let state: State = {
  archivedOnly: false,
  searchTerm: "",
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

const getSnapshot = (): State => state;

const setState = (next: Partial<State>): void => {
  state = { ...state, ...next };
  emit();
};

export const use = (): State =>
  React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const setArchive = (next?: boolean): void => {
  const archivedOnly = next ?? !state.archivedOnly;

  if (state.archivedOnly === archivedOnly) {
    return;
  }

  setState({ archivedOnly });
};

export const setSearchTerm = (next: string): void => {
  if (state.searchTerm === next) {
    return;
  }

  setState({ searchTerm: next });
};

export const setSearch = setSearchTerm;
