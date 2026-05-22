import { useState } from "../../../model/editor.state.js";
import { EditorContentFormTitle } from "./FieldTitle.js";
import { EditorContentFormSlug } from "./FieldSlug.js";
import { EditorContentFormContent } from "./FieldContent.js";
import { EditorContentTitle } from "./HeaderTitle.js";

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
