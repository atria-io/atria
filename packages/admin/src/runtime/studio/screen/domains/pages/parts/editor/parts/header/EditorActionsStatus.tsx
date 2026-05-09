import { useEditorState } from "../../services/editorState.js";
import { parsePagesRoute } from "../../../../services/state/pagesState.js";

export function EditorActionsStatus() {
  const { currentUuid, drafts } = useEditorState();
  const route = parsePagesRoute(window.location.pathname);

  const currentDraft = currentUuid
    ? drafts.find((item) => item.uuid === currentUuid)
    : null;

  const status = route.mode === "create"
    ? "Draft"
    : currentDraft?.status === "archived"
      ? "Archived"
      : currentDraft?.status === "published"
        ? "Online"
        : "Draft";

  if (status === "Online") {
    return <div className="pages-editor__status--online">{status}</div>;
  }

  return <div className="pages-editor__status--draft">{status}</div>;
}
