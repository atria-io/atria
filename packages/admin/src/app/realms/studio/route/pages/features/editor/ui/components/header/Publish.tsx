import { Button } from "@atria/ui";
import { publish, useState } from "../../deps.js";
import { parse } from "../../deps.js";

export function Publish() {
  const { hasEditorChanges } = useState();
  const isCreateRoute = parse(window.location.pathname).mode === "create";
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
