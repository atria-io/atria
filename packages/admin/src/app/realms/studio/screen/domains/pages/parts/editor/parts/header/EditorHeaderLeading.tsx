import { useEditorState } from "../../services/editorState.js";
import { EditorHeaderTitle } from "./EditorHeaderTitle.js";
import { EditorHeaderTools } from "./EditorHeaderTools.js";

export function EditorHeaderLeading() {
  const { creating, title } = useEditorState();

  const onClose = (): void => {
    window.history.pushState({}, "", "/pages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (!creating) {
    return <div>No properties</div>;
  }

  return (
    <div className="pages-editor__header-leading">
      <EditorHeaderTools onClose={onClose} />
      <EditorHeaderTitle title={title} />
    </div>
  );
}
