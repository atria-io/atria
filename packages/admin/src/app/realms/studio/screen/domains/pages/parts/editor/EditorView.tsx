import { EditorHeader } from "./parts/header/EditorHeader.js";
import { EditorMain } from "./parts/main/EditorMain.js";
import { useEditorStateSetup } from "./services/editorState.js";

export function EditorView() {
  useEditorStateSetup();

  return (
    <>
      <EditorHeader />
      <EditorMain />
    </>
  );
}
