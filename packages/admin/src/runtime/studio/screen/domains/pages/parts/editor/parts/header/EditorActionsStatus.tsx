import { useEditorState } from "../../services/editorState.js";
import { parsePagesRoute } from "../../../../services/state/pagesState.js";

export function EditorActionsStatus() {
  const { currentUuid, drafts } = useEditorState();
  const route = parsePagesRoute(window.location.pathname);

  const currentDraft = currentUuid
    ? drafts.find((item) => item.uuid === currentUuid)
    : null;

  const isDraft = route.mode === "create" || currentDraft?.status === "draft";
  const status = isDraft ? "Draft" : "Online";

  if (isDraft) {
    return <div className="pages-editor__status--draft">{status}</div>;
  }

  return <div className="pages-editor__status--online">{status}</div>;
}
