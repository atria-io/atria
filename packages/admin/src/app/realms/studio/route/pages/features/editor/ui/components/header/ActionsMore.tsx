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

type ActionsMoreProps = {
  panelId: string;
  isOpen: boolean;
  isClosing: boolean;
  isMounted: boolean;
  onToggle: () => void;
  onPanelAnimationEnd: React.AnimationEventHandler<HTMLDivElement>;
  onItemClick: (
    event: React.MouseEvent<HTMLButtonElement>,
    onClick?: () => void,
  ) => void;
  items: ActionsMoreItem[];
};

const PANEL_ID = "pages-editor-more-panel-menu";

function ActionsMoreButton({
  panelId,
  isOpen,
  onToggle,
}: ActionsMoreProps) {
  return (
    <Button
      type="button"
      variant="overlay"
      square
      icon
      aria-label="More"
      aria-haspopup="menu"
      aria-controls={panelId}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <Icon.Ellipsis size={16} />
    </Button>
  );
}

function ActionsMoreContent({ items, onItemClick }: ActionsMoreProps) {
  return (
    <>
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
            label={<span className="pages-actions-more__label">{item.label}</span>}
            role="menuitem"
            onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
              onItemClick(event, item.onClick)
            }
          >
            <item.icon size={13} />
          </Button>
        );
      })}
    </>
  );
}

function ActionsMorePopover({
  panelId,
  isOpen,
  isClosing,
  isMounted,
  onPanelAnimationEnd,
  children,
}: ActionsMoreProps & { children: React.ReactNode }) {
  return (
    <Popover
      id={panelId}
      open={isOpen}
      closing={isClosing}
      mounted={isMounted}
      onAnimationEnd={onPanelAnimationEnd}
      className="pages-actions-more--editor"
    >
      {children}
    </Popover>
  );
}

function ActionsMore() {
  const { creating, currentUuid, drafts } = deps.useState();
  const currentItem = currentUuid
    ? drafts.find((item) => item.uuid === currentUuid)
    : null;
  const isArchived = currentItem?.status === "archived";
  const isPublished = currentItem?.status === "published";
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
          onClick: deps.unpublish,
        }
      : {
          key: "archive",
          label: "Archive",
          icon: Icon.Archive,
          onClick: () => {
            if (!currentItem) {
              return;
            }
            if (isPublished) {
              deps.openArchivePage(currentItem.uuid, currentItem.title);
              return;
            }
            deps.archive();
          },
        },
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

  const onToggle = (): void => {
    toggle();
  };

  const onItemClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    onClick?: () => void,
  ): void => {
    event.stopPropagation();
    onClick?.();
  };

  const props: ActionsMoreProps = {
    panelId: PANEL_ID,
    isOpen,
    isClosing,
    isMounted,
    onToggle,
    onPanelAnimationEnd: onAnimationEnd,
    onItemClick,
    items,
  };

  return (
    <div
      className="pages-actions-more"
      data-tooltip={isMounted ? undefined : "More"}
      ref={rootRef}
    >
      <ActionsMoreButton {...props} />
      <ActionsMorePopover {...props}>
        <ActionsMoreContent {...props} />
      </ActionsMorePopover>
    </div>
  );
}

export { ActionsMore };
