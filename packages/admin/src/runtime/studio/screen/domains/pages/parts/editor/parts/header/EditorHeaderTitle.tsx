import { Braces, Ellipsis, UndoDot, Languages, X } from "lucide-react";
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
    <>
      <div className="pages-editor__header-leading">
        <div className="pages-editor__header-tools" aria-label="Page tools">
          <EditorActionButton ariaLabel="Close" tooltip="Close" icon={X} onClick={onClose} />
          <EditorActionButton ariaLabel="JSON" tooltip="JSON" icon={Braces} />
          <EditorActionButton ariaLabel="Translate" tooltip="Translate" icon={Languages} />
          <EditorActionButton ariaLabel="History" tooltip="History" icon={UndoDot} />
          <EditorActionButton ariaLabel="More" tooltip="More" icon={Ellipsis} />
        </div>
        <div className="pages-editor__header-title">
          {/*<div>{title.trim() ? `Edit Page / ${title}` : "Edit Page"}</div>*/}
          <div>{title.trim() ? `${title}` : "Edit Page"}</div>
        </div>
      </div>
    </>
  );
}
