import type { EditorState } from "./editor.types.js";
import { parsePagesRoute } from "./editor.routes.js";

const resolveInitialCreating = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return parsePagesRoute(window.location.pathname).mode === "create";
};

let editorState: EditorState = {
  isResolving: true,
  creating: resolveInitialCreating(),
  hasEditorChanges: false,
  title: "",
  slug: "",
  content: "",
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
