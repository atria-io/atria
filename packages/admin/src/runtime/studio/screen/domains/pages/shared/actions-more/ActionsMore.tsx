import { useEffect, useRef, type MouseEvent } from "react";
import { Ellipsis, type LucideIcon } from "lucide-react";
import { usePopoverState } from "@/runtime/studio/chrome/header/parts/actions/account/service/usePopoverState.js";

export interface ActionsMoreItem {
  key: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  hidden?: boolean;
  onClick?: () => void;
}

interface ActionsMoreProps {
  panelId: string;
  items: ActionsMoreItem[];
  variant: "editor" | "catalog";
  stopPropagation?: boolean;
  catalogItemKey?: string;
}

export function ActionsMore({
  panelId,
  items,
  variant,
  stopPropagation = false,
  catalogItemKey
}: ActionsMoreProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, closePanel, onPanelAnimationEnd } = usePopoverState(rootRef);

  const onClickMore = (event: MouseEvent<HTMLButtonElement>): void => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    togglePanel();
  };

  const onClickItem = (event: MouseEvent<HTMLButtonElement>, onClick?: () => void): void => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onClick?.();
  };

  useEffect(() => {
    if (variant !== "catalog") {
      return;
    }

    const onCatalogHover = (event: Event): void => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === catalogItemKey) {
        return;
      }
      closePanel();
    };

    window.addEventListener("atria:pages:catalog-hover", onCatalogHover);
    return () => {
      window.removeEventListener("atria:pages:catalog-hover", onCatalogHover);
    };
  }, [variant, catalogItemKey, closePanel]);

  return (
    <div className={`pages-actions-more pages-actions-more--${variant}`} ref={rootRef}>
      <button
        type="button"
        className="button button--square button--overlay button--has-icon"
        aria-label="More"
        aria-haspopup="menu"
        aria-controls={panelId}
        aria-expanded={isOpen}
        data-tooltip={isOpen ? undefined : "More"}
        onClick={onClickMore}
      >
        <div className="button__icon">
          <Ellipsis size={16} />
        </div>
      </button>

      {isMounted ? (
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
              {items.map((item) => {
                if (item.hidden) {
                  return null;
                }

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`button button--square button--overlay button--has-icon button--start${item.danger ? " button--danger-hover" : ""}`}
                    role="menuitem"
                    onClick={(event) => onClickItem(event, item.onClick)}
                  >
                    <span className="button__icon" aria-hidden="true"><item.icon size={13} /></span>
                    <span className="button__label pages-actions-more__label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
