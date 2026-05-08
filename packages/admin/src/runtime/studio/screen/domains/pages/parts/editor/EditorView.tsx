import { EditorHeader } from "./parts/header/EditorHeader.js";
import { EditorMain } from "./parts/main/EditorMain.js";
import type { EditorViewProps } from "./types.js";

export function EditorView({ creating }: EditorViewProps) {
  return (
    <>
      <EditorHeader creating={creating} />
      <EditorMain creating={creating} />
    </>
  );
}
