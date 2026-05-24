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
  const [open, setOpen] = React.useState(false);
  const [confirmArchive, setConfirmArchive] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const isArchived = item.status === "archived";
  const isPublished = item.status === "published";

  const closeMenu = React.useCallback((): void => {
    setOpen(false);
    setConfirmArchive(false);
  }, []);

  const items: ActionsMoreItem[] = [
    isArchived
      ? {
          key: "unarchive",
          label: "Unarchive",
          icon: Icon.Upload,
          onClick: () => {
            void deps.unpublishById(item.uuid).then((updated) => {
              if (!updated) {
                return;
              }
              deps.setArchive(false);
            });
          },
        }
      : {
          key: "archive",
          label: "Archive",
          icon: Icon.Archive,
          onClick: () => setConfirmArchive(true),
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

  const onToggle = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (open) {
      closeMenu();
      return;
    }
    setOpen(true);
  };

  const onRootClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  React.useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const onDocumentMouseDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      if (root.contains(event.target as Node)) {
        return;
      }

      closeMenu();
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, [closeMenu, open]);

  const onActionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    onClick?: () => void,
  ): void => {
    event.stopPropagation();
    onClick?.();
  };

  const onConfirmArchive = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    closeMenu();

    if (isPublished) {
      deps.openArchivePage(item.uuid, item.title);
      return;
    }

    void deps.archiveById(item.uuid).then((updated) => {
      if (!updated) {
        return;
      }
    });
  };

  return (
    <div className="pages-catalog__item-more" onClick={onRootClick} ref={rootRef}>
      <Button
        type="button"
        variant="overlay"
        square
        icon
        className="pages-catalog__item-more-toggle"
        aria-label="More"
        aria-expanded={open}
        onClick={onToggle}
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
              onClick={onConfirmArchive}
              label="Confirm"
            />
          ) : visibleItems.map((entry, visibleIndex) => {
            return (
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
                  onActionClick(event, entry.onClick)
                }
              >
                <entry.icon size={13} />
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export { ActionsMore };
