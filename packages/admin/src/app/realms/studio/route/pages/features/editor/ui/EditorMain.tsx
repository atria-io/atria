import { useState } from "../model/editor.state.js";
import { EditorViewContent } from "./EditorViewContent.js";

export function EditorMain() {
  const { creating } = useState();

  if (!creating) {
    return (
      <div className="card-column__item" data-type="edit"></div>
    );
  }

  return (
    <EditorViewContent />
  );
}
