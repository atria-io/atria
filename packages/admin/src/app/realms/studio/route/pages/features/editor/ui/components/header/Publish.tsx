import { Button } from "@atria/ui";
import * as deps from "../../deps.js";

function Publish() {
  const { canonicalStatus, editorMode, hasEditorChanges } = deps.useState();
  const isArchived = canonicalStatus === "archived";
  const shortcut = {
    key: isArchived ? "u" : "s",
    metaOrCtrl: true,
    preventDefault: true,
  } as const;
  const route = deps.parse(window.location.pathname);
  const canPublishCurrent =
    isArchived
    || canonicalStatus === "draft"
    || hasEditorChanges
    || editorMode;
  const isDisabledByMode = route.mode === "create"
    ? !hasEditorChanges
    : !canPublishCurrent;
  const isDisabled = isDisabledByMode;
  const onClick = isArchived ? deps.unpublish : deps.publish;
  const label = isArchived ? "Unarchive" : "Publish";
  const publishShortcutLabel = deps.formatKeydownLabel(shortcut);

  deps.keydown(
    {
      ...shortcut,
      enabled: !isDisabled,
    },
    onClick,
  );

  return (
    <div className="pages-editor__publish">
      <Button
        type="button"
        size="sm"
        align="center"
        variant="fill"
        disabled={isDisabled}
        className={!isDisabled && !isArchived ? "button--accent" : ""}
        label={label}
        aria-label={label}
        data-keydown={publishShortcutLabel}
        onClick={isDisabled ? undefined : onClick}
      />
    </div>
  );
}

export { Publish };
