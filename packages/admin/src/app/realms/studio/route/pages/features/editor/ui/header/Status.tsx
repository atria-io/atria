import { useState } from "../../model/editor.state.js";
import { parsePagesRoute } from "../../../../routes/pages.routes.js";

export function Status() {
  const { currentUuid, drafts } = useState();
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
    return (
      <div className="pages-editor__status pages-editor__status--online">
        {status}
      </div>
    );
  }

  return (
    <div className="pages-editor__status pages-editor__status--draft">
      {status}
    </div>
  );
}
