import { EditorHeader } from "./parts/header/EditorHeader.js";
import { EditorMain } from "./parts/main/EditorMain.js";
import { useEditorStateSetup } from "./services/editorState.js";
import type { EditorViewProps } from "./types.js";

export function EditorView({ creating }: EditorViewProps) {
  useEditorStateSetup(creating);

  return (
    <>
      <EditorHeader />
      <EditorMain />
    </>
  );
}
