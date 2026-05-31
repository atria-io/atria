import * as React from "react";
import * as Icon from "lucide-react";
import * as deps from "../../deps.js";
import { Button } from "@atria/ui";

interface ActionsMoreProps {
  item: deps.CatalogItem;
  onOpenChange?: (open: boolean) => void;
}

interface ActionsMoreItem {
  key: string;
  label: string;
  icon: Icon.LucideIcon;
  danger?: boolean;
  hidden?: boolean;
  onClick?: () => void;
}

function ActionsMore({ item, onOpenChange }: ActionsMoreProps) {
  const {
    actionClick,
    confirm,
    confirmArchive,
    isArchived,
    isPublished,
    open,
    requestArchive,
    rootClick,
    rootRef,
    toggle,
  } = deps.useCatalogActionsMoreModel(item, onOpenChange);

  const items: ActionsMoreItem[] = [
    isArchived
      ? {
          key: "unarchive",
          label: "Unarchive",
          icon: Icon.Upload,
          onClick: () => {
            void deps.unpublishById(item.uuid).then((updated) => {
              if (updated) {
                deps.setArchived(false);
              }
            });
          },
        }
      : {
          key: "archive",
          label: "Archive",
          icon: Icon.Archive,
          onClick: requestArchive,
        },
    {
      key: "publish",
      label: "Publish",
      icon: Icon.Upload,
      hidden: isArchived || item.status === "published",
      onClick: () => {
        void deps.publishById(item.uuid);
      },
    },
    {
      key: "unpublish",
      label: "Unpublish",
      icon: Icon.EyeOff,
      hidden: isArchived || item.status !== "published",
      onClick: () => {
        void deps.unpublishById(item.uuid);
      },
    },
    {
      key: "delete",
      label: "Delete",
      icon: Icon.Trash2,
      danger: true,
      onClick: () => deps.openDeletePage(item.uuid, item.title),
    },
  ];
  const visibleItems = items.filter((entry) => !entry.hidden);

  return (
    <div className="pages-catalog__item-more" onClick={rootClick} ref={rootRef}>
      <Button
        type="button"
        variant="overlay"
        square
        icon
        className="pages-catalog__item-more-toggle"
        aria-label="More"
        aria-expanded={open}
        onClick={toggle}
      >
        {open ? <Icon.X size={15} /> : <Icon.Ellipsis size={13} />}
      </Button>
      {open ? (
        <div className="pages-catalog__item-more-actions" role="menu">
          {confirmArchive ? (
            <Button
              type="button"
              variant="danger"
              size="xs"
              font="xs"
              className="pages-catalog__item-more-confirm"
              onClick={confirm}
              label="Confirm"
            />
          ) : visibleItems.map((entry, visibleIndex) => (
            <Button
              key={entry.key}
              type="button"
              variant={entry.danger ? ["overlay", "danger"] : "overlay"}
              square
              icon
              style={{ "--delay": `${visibleIndex * 15}ms` } as React.CSSProperties}
              role="menuitem"
              aria-label={entry.label}
              data-tooltip={entry.label}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                actionClick(event, entry.onClick)}
            >
              <entry.icon size={13} />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { ActionsMore };
