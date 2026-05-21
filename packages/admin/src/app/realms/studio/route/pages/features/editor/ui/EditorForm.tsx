import { touchEditorCreateInteraction, useEditorState } from "../model/editor.state.js";
import { EditorFormTitle } from "./forms/EditorFormTitle.js";
import { EditorFormSlug } from "./forms/EditorFormSlug.js";
import { EditorFormContent } from "./forms/EditorFormContent.js";
import { EditorHeaderTitle } from "./EditorHeaderTitle.js";

export function EditorForm() {
  const { title } = useEditorState();
  return (
    <form className="pages-editor__create-form" onFocusCapture={touchEditorCreateInteraction}>
      <EditorHeaderTitle title={title} />
      <EditorFormTitle />
      <EditorFormSlug />
      <EditorFormContent />
    </form>
  );
}
