import { useEditorState } from "../../services/editorState.js";

export function EditorHeaderTitle() {
  const { creating, title } = useEditorState();

  if (!creating) {
    return <div>No properties</div>;
  }

  return <div>{title.trim() ? `Edit Page / ${title}` : "Edit Page"}</div>;
}
