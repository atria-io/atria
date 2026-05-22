import { Button } from "@atria/ui";
import { publish, useState } from "../../model/editor.state.js";
import { parsePagesRoute } from "../../../../routes/pages.routes.js";

export function Publish() {
  const { hasEditorChanges } = useState();
  const isCreateRoute = parsePagesRoute(window.location.pathname).mode === "create";
  const publishLocked = isCreateRoute && !hasEditorChanges;

  return (
    <Button
      type="button"
      size="sm"
      align="center"
      variant={["fill", "overlay"]}
      className={!publishLocked ? "button--accent" : ""}
      style={publishLocked ? { pointerEvents: "none" } : undefined}
      label="Publish"
      aria-label="Publish"
      onClick={publishLocked ? undefined : publish}
    />
  );
}
