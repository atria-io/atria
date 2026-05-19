import { EditorFormTitle } from "./forms/EditorFormTitle.js";
import { EditorFormSlug } from "./forms/EditorFormSlug.js";
import { EditorFormContent } from "./forms/EditorFormContent.js";

export function EditorForm() {
  return (
    <form className="pages-editor__create-form">
      <EditorFormTitle />
      <EditorFormSlug />
      <EditorFormContent />
    </form>
  );
}
