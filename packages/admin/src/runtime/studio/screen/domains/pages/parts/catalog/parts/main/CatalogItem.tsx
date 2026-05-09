import type { MouseEvent } from "react";
import { useEffect, useRef } from "react";
import { Dot, Ellipsis } from "lucide-react";
import type { CatalogItem as CatalogItemType } from "../../../editor/services/editorState.js";
import { resolveDocumentPath } from "../../../../services/state/pagesState.js";

interface CatalogItemProps {
  item: CatalogItemType;
  active: boolean;
}

export function CatalogItem({ item, active }: CatalogItemProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isDraft = item.status === "draft";
  const statusLabel = isDraft ? "Draft" : "Online";
  const statusClassName = isDraft
    ? "pages-catalog__item-status draft"
    : "pages-catalog__item-status online";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    if (active) {
      root.setAttribute("active", "");
      return;
    }

    root.removeAttribute("active");
  }, [active]);

  const onOpenItem = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
    window.history.pushState({}, "", resolveDocumentPath(item.uuid));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      className="pages-catalog__item"
      key={item.uuid}
      onClick={onOpenItem}
      ref={rootRef}
    >
      <span className={statusClassName} aria-label={statusLabel} title={statusLabel}>
        <Dot size={16} />
      </span>
      <span className="pages-catalog__item-title">
        <span>{item.title.trim() || "Untitled page"}</span>
      </span>
        <button
          type="button"
          className="button button--square button--overlay button--has-icon pages-catalog__show-more"
          aria-label="More"
        >
        <div className="button__icon" data-tooltip="More">
          <Ellipsis size={16} />
        </div>
      </button>
    </div>
  );
}
