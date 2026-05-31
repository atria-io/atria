import * as React from "react";
import * as Icon from "lucide-react";
import * as deps from "../../deps.js";
import { Button, Popover, usePopover } from "@atria/ui";

interface ActionsMoreItem {
  key: string;
  label: string;
  icon: Icon.LucideIcon;
  danger?: boolean;
  hidden?: boolean;
  onClick?: () => void;
}

const PANEL_ID = "pages-editor-more-panel-menu";

function ActionsMore() {
  const {
    archive,
    creating,
    currentItem,
    isArchived,
    isPublished,
    openDelete,
    unarchive,
    unpublish,
  } = deps.useEditorActionsMoreModel();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, toggle, onAnimationEnd } = usePopover(rootRef);

  if (!creating) {
    return null;
  }

  const items: ActionsMoreItem[] = [
    isArchived
      ? {
          key: "unarchive",
          label: "Unarchive",
          icon: Icon.Upload,
          onClick: unarchive,
        }
      : {
          key: "archive",
          label: "Archive",
          icon: Icon.Archive,
          onClick: archive,
        },
    {
      key: "unpublish",
      label: "Unpublish",
      icon: Icon.EyeOff,
      onClick: unpublish,
      hidden: isArchived || currentItem?.status !== "published",
    },
    {
      key: "delete",
      label: "Delete",
      icon: Icon.Trash2,
      danger: true,
      onClick: openDelete,
    },
  ];

  const onItemClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    onClick?: () => void,
  ): void => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <div
      className="pages-editor__more"
      data-tooltip={isMounted ? undefined : "More"}
      ref={rootRef}
    >
      <Button
        type="button"
        variant="overlay"
        square
        icon
        aria-label="More"
        aria-haspopup="menu"
        aria-controls={PANEL_ID}
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <Icon.Ellipsis size={16} />
      </Button>
      <Popover
        id={PANEL_ID}
        open={isOpen}
        closing={isClosing}
        mounted={isMounted}
        onAnimationEnd={onAnimationEnd}
      >
        {items.map((item) => {
          if (item.hidden) {
            return null;
          }

          return (
            <Button
              key={item.key}
              type="button"
              variant={item.danger ? ["overlay", "danger"] : "overlay"}
              square
              icon
              align="start"
              label={<span className="pages-editor__actions-more-label">{item.label}</span>}
              role="menuitem"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                onItemClick(event, item.onClick)}
            >
              <item.icon size={13} />
            </Button>
          );
        })}
      </Popover>
    </div>
  );
}

export { ActionsMore };
