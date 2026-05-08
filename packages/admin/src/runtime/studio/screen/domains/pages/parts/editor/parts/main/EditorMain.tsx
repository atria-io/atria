import { EditorForm } from "./EditorForm.js";
import type { MainProps } from "./types.js";

export function EditorMain({ creating }: MainProps) {
  if (!creating) {
    return;
  }

  return (
    <div className="card-column__item" data-type="edit">
      <div>
        <div className="pages-editor pages-editor--edit">
          <div className="pages-editor pages-editor__main">
            <EditorForm />
          </div>
        </div>
      </div>
    </div>
  );
}
