import { Braces, Ellipsis, History, Languages } from "lucide-react";
import { useEditorState } from "../../services/editorState.js";
import { EditorActionsStatus } from "./EditorActionsStatus.js";
import { EditorActionButton } from "./shared/EditorActionButton.js";

export function EditorActions() {
  const { creating } = useEditorState();

  if (!creating) {
    return null;
  }

  return (
    <div className="pages-editor__header-action">
      <div className="pages-editor__header-tools" aria-label="Page tools">
        <EditorActionButton ariaLabel="History" tooltip="History" icon={History} />
        <EditorActionButton ariaLabel="JSON" tooltip="JSON" icon={Braces} />
        <EditorActionButton ariaLabel="Translate" tooltip="Translate" icon={Languages} />
        <EditorActionButton ariaLabel="More options" tooltip="More options" icon={Ellipsis} />
      </div>
      <EditorActionsStatus />
      <EditorActionButton ariaLabel="Publish" label="Publish" />
    </div>
  );
}
