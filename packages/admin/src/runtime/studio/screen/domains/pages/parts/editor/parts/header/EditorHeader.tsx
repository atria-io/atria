import { EditorActions } from "./EditorActions.js";
import { EditorHeaderLeading } from "./EditorHeaderLeading.js";

export function EditorHeader() {
  return (
    <div className="card-column__item card-column__item--intrinsic" data-type="properties">
      <div className="card-screen">
        <div className="pages-editor pages-editor--properties">
          <div className="pages-editor__header">
            <EditorHeaderLeading />
            <EditorActions />
          </div>
        </div>
      </div>
    </div>
  );
}
