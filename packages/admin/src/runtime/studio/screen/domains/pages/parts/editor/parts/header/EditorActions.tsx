import { publishEditorPage, useEditorState } from "../../services/editorState.js";
import { EditorActionsMore } from "./EditorActionsMore.js";
import { EditorActionsStatus } from "./EditorActionsStatus.js";
import { EditorActionButton } from "./shared/EditorActionButton.js";

export function EditorActions() {
  const { creating } = useEditorState();

  if (!creating) {
    return null;
  }

  return (
    <div className="pages-editor__header-action">
      <EditorActionsMore />
      <EditorActionsStatus />
      <EditorActionButton ariaLabel="Publish" label="Publish" onClick={publishEditorPage} />
    </div>
  );
}
