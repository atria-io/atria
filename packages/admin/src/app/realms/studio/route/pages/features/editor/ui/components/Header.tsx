import { Actions } from "./header/Actions.js";
import { Leading } from "./header/Leading.js";
import type { EditorView } from "../../index.js";

interface EditorHeaderProps {
  onViewChange: (view: EditorView) => void;
  view: EditorView;
}

function EditorHeader({ onViewChange, view }: EditorHeaderProps) {
  return (
    <div className="card-screen">
      <div className="pages-editor__header">
        <Leading view={view} onViewChange={onViewChange} />
        <Actions />
      </div>
    </div>
  );
}

export { EditorHeader };
