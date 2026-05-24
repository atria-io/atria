import { Button } from "@atria/ui";
import { formatKeydownLabel, keydown } from "@/app/system/hooks/keydown.js";
import { publish, useState } from "../../deps.js";

const publishShortcut = {
  key: "s",
  metaOrCtrl: true,
  preventDefault: true,
} as const;

function Publish() {
  const { currentUuid, drafts, hasEditorChanges } = useState();
  const currentItem = currentUuid
    ? drafts.find((item) => item.uuid === currentUuid)
    : null;
  const canPublishDraft = currentItem?.status === "draft";
  const isDisabled = !hasEditorChanges && !canPublishDraft;
  const publishShortcutLabel = formatKeydownLabel(publishShortcut);

  keydown(
    {
      ...publishShortcut,
      enabled: !isDisabled,
    },
    publish,
  );

  return (
    <Button
      type="button"
      size="sm"
      align="center"
      variant="fill"
      disabled={isDisabled}
      className={!isDisabled ? "button--accent" : ""}
      label="Publish"
      aria-label="Publish"
      data-keydown={publishShortcutLabel}
      onClick={isDisabled ? undefined : publish}
    />
  );
}

export { Publish };
