import { Button } from "@atria/ui";
import { formatKeydownLabel, keydown } from "@/app/system/hooks/keydown.js";
import { publish, useState } from "../../deps.js";
import { parse } from "../../deps.js";

const publishShortcut = {
  key: "s",
  metaOrCtrl: true,
  preventDefault: true,
} as const;

function Publish() {
  const { hasEditorChanges } = useState();
  const isCreateRoute = parse(window.location.pathname).mode === "create";
  const publishLocked = isCreateRoute && !hasEditorChanges;
  const publishShortcutLabel = formatKeydownLabel(publishShortcut);

  keydown(
    {
      ...publishShortcut,
      enabled: !publishLocked,
    },
    publish,
  );

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
      data-keydown={publishShortcutLabel}
      onClick={publishLocked ? undefined : publish}
    />
  );
}

export { Publish };
