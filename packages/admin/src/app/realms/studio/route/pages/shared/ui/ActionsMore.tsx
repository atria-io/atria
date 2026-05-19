import * as React from "react";
import * as Icon from "lucide-react";
import { Button } from "@atria/ui";
import { usePopover } from "@atria/ui";

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
  variant: "editor" | "catalog";
  stopPropagation?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function TriggerButton({
  panelId,
  isOpen,
  isMounted,
  onClick,
}: {
  panelId: string;
  isOpen: boolean;
  isMounted: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
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
      onClick={onClick}
    >
      <Icon.Ellipsis size={16} />
    </Button>
  );
}

function ActionItemButton({
  item,
  onClick,
}: {
  item: ActionsMoreItem;
  onClick: (event: React.MouseEvent<HTMLButtonElement>, onClick?: () => void) => void;
}) {
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
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => onClick(event, item.onClick)}
    >
      <item.icon size={13} />
    </Button>
  );
}

function Panel({
  panelId,
  isClosing,
  variant,
  onPanelAnimationEnd,
  items,
  onClickItem,
}: {
  panelId: string;
  isClosing: boolean;
  variant: "editor" | "catalog";
  onPanelAnimationEnd: React.AnimationEventHandler<HTMLDivElement>;
  items: ActionsMoreItem[];
  onClickItem: (event: React.MouseEvent<HTMLButtonElement>, onClick?: () => void) => void;
}) {
  return (
    <div
      id={panelId}
      className={
        !isClosing
          ? `pages-actions-more__panel pages-actions-more__panel--${variant} pages-actions-more__panel--open`
          : `pages-actions-more__panel pages-actions-more__panel--${variant} pages-actions-more__panel--closing`
      }
      onAnimationEnd={onPanelAnimationEnd}
    >
      <div className="pages-actions-more__menu">
        <div className="pages-actions-more__menu-content" aria-label="Page actions">
          {items.map((item) => (
            <ActionItemButton key={item.key} item={item} onClick={onClickItem} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionsMore({
  panelId,
  items,
  variant,
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

  const onClickItem = (event: React.MouseEvent<HTMLButtonElement>, onClick?: () => void): void => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onClick?.();
  };

  React.useEffect(() => {
    onOpenChange?.(isMounted);
  }, [isMounted, onOpenChange]);

  return (
    <div className={`pages-actions-more pages-actions-more--${variant}`} ref={rootRef}>
      <TriggerButton panelId={panelId} isOpen={isOpen} isMounted={isMounted} onClick={onClickMore} />
      {isMounted ? (
        <Panel
          panelId={panelId}
          isClosing={isClosing}
          variant={variant}
          onPanelAnimationEnd={onAnimationEnd}
          items={items}
          onClickItem={onClickItem}
        />
      ) : null}
    </div>
  );
}

export { ActionsMore };
