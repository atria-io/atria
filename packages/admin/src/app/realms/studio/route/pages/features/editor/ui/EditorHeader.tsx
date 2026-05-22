import { Actions } from "./header/Actions.js";
import { Leading } from "./header/Leading.js";
import { useState } from "../model/editor.state.js";
import type { EditorView } from "../index.js";

interface EditorHeaderProps {
  onViewChange: (view: EditorView) => void;
  view: EditorView;
}

export function EditorHeader({ onViewChange, view }: EditorHeaderProps) {
  const { isResolving } = useState();

  return (
    <div className="card-screen">
      {isResolving ? null : (
        <div className="pages-editor__header">
          <Leading view={view} onViewChange={onViewChange} />
          <Actions />
        </div>
      )}
    </div>
  );
}
