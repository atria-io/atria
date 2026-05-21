import { EditorActions } from "./EditorActions.js";
import { EditorHeaderLeading } from "./EditorHeaderLeading.js";
import { useState } from "../model/editor.state.js";

export function EditorHeader() {
  const { isResolving } = useState();

  return (
    <div className="card-column__item card-column__item--intrinsic" data-type="properties">
      <div className="card-screen">
        <div className="pages-editor pages-editor--properties">
          {isResolving ? null : (
            <div className="pages-editor__header">
              <EditorHeaderLeading />
              <EditorActions />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
