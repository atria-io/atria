import { useEditorState } from "../model/editor.state.js";
import { EditorForm } from "./EditorForm.js";

export function EditorMain() {
  const { creating } = useEditorState();
  if (!creating) {
    return (
      <div className="card-column__item" data-type="edit"></div>
    );
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
