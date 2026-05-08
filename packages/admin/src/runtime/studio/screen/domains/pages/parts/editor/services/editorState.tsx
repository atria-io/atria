import { useEffect, useSyncExternalStore } from "react";

interface EditorState {
  creating: boolean;
  title: string;
}

let editorState: EditorState = {
  creating: false,
  title: "",
};

const listeners = new Set<() => void>();

const emit = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const setEditorState = (next: Partial<EditorState>): void => {
  editorState = { ...editorState, ...next };
  emit();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): EditorState => editorState;

export const useEditorState = (): EditorState =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const useEditorStateSetup = (creating: boolean): void => {
  useEffect(() => {
    setEditorState({ creating });
  }, [creating]);
};

export const setEditorTitle = (title: string): void => {
  setEditorState({ title });
};
