import { useState } from "../model/editor.state.js";
import { EditorContentFormTitle } from "./forms/EditorContentFormTitle.js";
import { EditorContentFormSlug } from "./forms/EditorContentFormSlug.js";
import { EditorContentFormContent } from "./forms/EditorContentFormContent.js";
import { EditorHeaderTitle } from "./EditorHeaderTitle.js";

export function EditorViewContent() {
  const { title } = useState();
  return (
    <div className="card-column__item" data-view="content">
      <div className="pages-editor pages-editor__main">
        <div className="pages-editor pages-editor--edit">
          <div>
            <form className="pages-editor__create-form">
              <EditorHeaderTitle title={title} />
              <EditorContentFormTitle />
              <EditorContentFormSlug />
              <EditorContentFormContent />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
