import * as React from "react";
import * as Icon from "lucide-react";
import { Button, usePopover } from "@atria/ui";

interface ActionsMoreItem {
  key: string;
  label: string;
  icon: Icon.LucideIcon;
  danger?: boolean;
  hidden?: boolean;
  onClick?: () => void;
}

interface ActionsMoreProps {
  panelId: string;
  items: ActionsMoreItem[];
  stopPropagation?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ActionsMore({
  panelId,
  items,
  stopPropagation = false,
  onOpenChange,
}: ActionsMoreProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, toggle, onAnimationEnd } = usePopover(rootRef);

  const onClickMore = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (stopPropagation) {
      event.stopPropagation();
    }
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
    if (stopPropagation) {
      event.stopPropagation();
    }
    onClick?.();
  };

  React.useEffect(() => {
    onOpenChange?.(isMounted);
  }, [isMounted, onOpenChange]);

  return (
    <div className="pages-actions-more pages-actions-more--catalog" ref={rootRef}>
      <Button
        type="button"
        variant="overlay"
        square
        icon
        className={isMounted ? "pages-actions-more__trigger--open" : ""}
        aria-label="More"
        aria-haspopup="menu"
        aria-controls={panelId}
        aria-expanded={isOpen}
        data-tooltip={isMounted ? undefined : "More"}
        onClick={onClickMore}
      >
        <Icon.Ellipsis size={16} />
      </Button>

      {isMounted ? (
        <div
          id={panelId}
          className={
            !isClosing
              ? "pages-actions-more__panel pages-actions-more__panel--catalog pages-actions-more__panel--open"
              : "pages-actions-more__panel pages-actions-more__panel--catalog pages-actions-more__panel--closing"
          }
          onAnimationEnd={onAnimationEnd}
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
        </div>
      ) : null}
    </div>
  );
}
