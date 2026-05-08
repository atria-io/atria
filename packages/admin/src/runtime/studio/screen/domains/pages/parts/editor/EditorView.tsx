import { EditorHeader } from "./parts/header/EditorHeader.js";
import { EditorMain } from "./parts/main/EditorMain.js";

interface EditorViewProps {
  creating: boolean;
}

export function EditorView({ creating }: EditorViewProps) {
  return (
    <div className="card-column__item" data-type="properties">
      <EditorHeader creating={creating} />
      <EditorMain creating={creating} />
    </div>
  );
}
