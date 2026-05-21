import { EditorHeader } from "./ui/EditorHeader.js";
import { EditorMain } from "./ui/EditorMain.js";
import { useSetup } from "./model/editor.state.js";

export function Editor() {
  useSetup();

  return (
    <>
      <EditorHeader />
      <EditorMain />
    </>
  );
}
