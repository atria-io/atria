import { useRef, type MouseEvent } from "react";
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
  stopPropagation?: boolean;
}

export function ActionsMore({ panelId, items, stopPropagation = false }: ActionsMoreProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isOpen, isClosing, isMounted, togglePanel, onPanelAnimationEnd } = usePopoverState(rootRef);

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

  return (
    <div className="pages-editor__more" ref={rootRef}>
      <button
        type="button"
        className="button button--square button--overlay button--has-icon"
        aria-label="More"
        aria-haspopup="menu"
        aria-controls={panelId}
        aria-expanded={isOpen}
        data-tooltip="More"
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
              ? "pages-editor__more-panel pages-editor__more-panel--open"
              : "pages-editor__more-panel pages-editor__more-panel--closing"
          }
          onAnimationEnd={onPanelAnimationEnd}
        >
          <div className="pages-editor__more-menu">
            <div className="pages-editor__more-menu-content" aria-label="Page actions">
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
                    <span className="button__label pages-editor__more-panel-label">{item.label}</span>
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
