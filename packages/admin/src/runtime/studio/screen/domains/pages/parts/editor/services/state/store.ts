import type { EditorState } from "./types.js";

let editorState: EditorState = {
  creating: false,
  title: "",
  slug: "",
  slugTouched: false,
  currentUuid: null,
  drafts: [],
};

const listeners = new Set<() => void>();

export const getEditorState = (): EditorState => editorState;

export const setEditorState = (next: Partial<EditorState>): void => {
  editorState = { ...editorState, ...next };
  for (const listener of listeners) {
    listener();
  }
};

export const subscribeEditorState = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
