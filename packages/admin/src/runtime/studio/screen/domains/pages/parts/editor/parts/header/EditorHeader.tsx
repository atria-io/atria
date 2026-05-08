import { EditorActions } from "./EditorActions.js";
import { EditorHeaderTitle } from "./EditorHeaderTitle.js";

export function EditorHeader() {
  return (
    <div className="card-column__item card-column__item--intrinsic" data-type="properties">
      <div className="card-screen">
        <div className="pages-editor pages-editor--properties">
          <div className="pages-editor__header">
            <EditorHeaderTitle />
            <EditorActions />
          </div>
        </div>
      </div>
    </div>
  );
}
