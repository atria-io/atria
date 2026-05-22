import { useState } from "../../model/editor.state.js";
import { EditorContentFormTitle } from "./EditorContentFormTitle.js";
import { EditorContentFormSlug } from "./EditorContentFormSlug.js";
import { EditorContentFormContent } from "./EditorContentFormContent.js";
import { EditorContentTitle } from "./EditorContentTitle.js";

export function EditorViewContent() {
  const { title } = useState();

  return (
    <form className="pages-editor__create-form">
      <EditorContentTitle title={title} />
      <EditorContentFormTitle />
      <EditorContentFormSlug />
      <EditorContentFormContent />
    </form>
  );
}
