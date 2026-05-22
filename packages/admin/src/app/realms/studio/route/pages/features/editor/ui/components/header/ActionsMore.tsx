import * as React from "react";
import * as Icon from "lucide-react";
import { Button, Popover, usePopover } from "@atria/ui";
import * as deps from "../../deps.js";

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
  const { creating, currentUuid, drafts } = deps.useState();
  const currentItem = currentUuid ? drafts.find((item) => item.uuid === currentUuid) : null;
  const isArchived = currentItem?.status === "archived";
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, toggle, onAnimationEnd } = usePopover(rootRef);

  if (!creating) {
    return null;
  }

  const items: ActionsMoreItem[] = [
    isArchived
      ? { key: "unarchive", label: "Unarchive", icon: Icon.Upload, onClick: deps.unpublish }
      : { key: "archive", label: "Archive", icon: Icon.Archive, onClick: deps.archive },
    {
      key: "unpublish",
      label: "Unpublish",
      icon: Icon.EyeOff,
      onClick: deps.unpublish,
      hidden: isArchived || currentItem?.status !== "published",
    },
    {
      key: "delete",
      label: "Delete",
      icon: Icon.Trash2,
      danger: true,
      onClick: () => {
        if (!currentItem) {
          return;
        }
        deps.openDeletePage(currentItem.uuid, currentItem.title);
      },
    },
  ];

  const onClickMore = (event: React.MouseEvent<HTMLButtonElement>): void => {
    toggle();
    if (!isOpen) {
      event.currentTarget.blur();
      event.currentTarget.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    }
  };

  const onClickItem = (
    event: React.MouseEvent<HTMLButtonElement>,
    onClick?: () => void,
  ): void => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <div className="pages-actions-more pages-actions-more--editor" ref={rootRef}>
      <Button
        type="button"
        variant="overlay"
        square
        icon
        className={isMounted ? "pages-actions-more__trigger--open" : ""}
        aria-label="More"
        aria-haspopup="menu"
        aria-controls={PANEL_ID}
        aria-expanded={isOpen}
        data-tooltip={isMounted ? undefined : "More"}
        onClick={onClickMore}
      >
        <Icon.Ellipsis size={16} />
      </Button>

      <Popover
        id={PANEL_ID}
        open={isOpen}
        closing={isClosing}
        mounted={isMounted}
        onAnimationEnd={onAnimationEnd}
        className="pages-actions-more__panel pages-actions-more__panel--editor"
      >
        <div className="pages-actions-more__menu">
          <div className="pages-actions-more__menu-content" aria-label="Page actions">
            {items.map((item) => {
              if (item.hidden) {
                return null;
              }

              return (
                <Button
                  key={item.key}
                  type="button"
                  variant="overlay"
                  square
                  icon
                  align="start"
                  label={<span className="pages-actions-more__label">{item.label}</span>}
                  className={item.danger ? "button--danger" : ""}
                  role="menuitem"
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                    onClickItem(event, item.onClick)
                  }
                >
                  <item.icon size={13} />
                </Button>
              );
            })}
          </div>
        </div>
      </Popover>
    </div>
  );
}

export { ActionsMore };
