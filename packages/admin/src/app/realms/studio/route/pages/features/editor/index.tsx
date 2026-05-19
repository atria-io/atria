import { EditorHeader } from "./ui/EditorHeader.js";
import { EditorMain } from "./ui/EditorMain.js";
import { useEditorStateSetup } from "./model/editor.state.js";

export function Editor() {
  useEditorStateSetup();

  return (
    <>
      <EditorHeader />
      <EditorMain />
    </>
  );
}
