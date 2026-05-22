import { useState } from "../../deps.js";
import { parse } from "../../deps.js";

function Status() {
  const { currentUuid, drafts } = useState();
  const route = parse(window.location.pathname);

  const currentDraft = currentUuid
    ? drafts.find((item) => item.uuid === currentUuid)
    : null;

  const status = route.mode === "create"
    ? "Draft"
    : currentDraft?.status === "archived"
      ? "Archived"
      : currentDraft?.status === "published"
        ? "Live"
        : "Draft";

  if (status === "Live") {
    return (
      <div className="pages-editor__status pages-editor__status--live">
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

export { Status };
