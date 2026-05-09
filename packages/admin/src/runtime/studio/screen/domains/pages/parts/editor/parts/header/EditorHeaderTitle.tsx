import { X } from "lucide-react";
import { useEditorState } from "../../services/editorState.js";
import { EditorActionButton } from "./shared/EditorActionButton.js";

export function EditorHeaderTitle() {
  const { creating, title } = useEditorState();

  const onClose = (): void => {
    window.history.pushState({}, "", "/pages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (!creating) {
    return <div>No properties</div>;
  }

  return (
    <div className="pages-editor__header-title">
      <EditorActionButton ariaLabel="Close" tooltip="Close" icon={X} onClick={onClose} />
      {/*<div>{title.trim() ? `Edit Page / ${title}` : "Edit Page"}</div>*/}
      <div>{title.trim() ? `${title}` : "Edit Page"}</div>
    </div>
  );
}
