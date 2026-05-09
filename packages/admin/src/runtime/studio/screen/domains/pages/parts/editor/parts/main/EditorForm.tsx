import { EditorFormTitle } from "./forms/EditorFormTitle.js";
import { EditorFormSlug } from "./forms/EditorFormSlug.js";

export function EditorForm() {
  return (
    <form className="pages-editor__create-form">
      <EditorFormTitle />
      <EditorFormSlug />
    </form>
  );
}
