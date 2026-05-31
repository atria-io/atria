import type { EditorState } from "./pages.types.js";
import { parse } from "../routes/pages.routes.js";

const isCreatingOnLoad = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return parse(window.location.pathname).mode === "create";
};

let editorState: EditorState = {
  creating: isCreatingOnLoad(),
  switching: false,
  editorMode: false,
  versionId: null,
  canonicalStatus: null,
  hasEditorChanges: false,
  title: "",
  slug: "",
  content: "",
  currentUuid: null,
  drafts: [],
  sync: {},
  historyByPage: {},
};

const listeners = new Set<() => void>();

export const getState = (): EditorState => editorState;

export const setState = (next: Partial<EditorState>): void => {
  editorState = { ...editorState, ...next };
  for (const listener of listeners) {
    listener();
  }
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
