import type { MouseEvent } from "react";
import { useEffect, useRef } from "react";
import { Dot } from "lucide-react";
import type { CatalogItem as CatalogItemType } from "../../../editor/services/editorState.js";
import { resolveDocumentPath } from "../../../../services/state/pagesState.js";

interface CatalogItemProps {
  item: CatalogItemType;
  active: boolean;
}

export function CatalogItem({ item, active }: CatalogItemProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

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
      <span className="pages-catalog__item-status" aria-label={item.status} title={item.status}>
        <Dot size={16} />
      </span>
      <span className="pages_catalog__item-title">
        <span>{item.title.trim() || "Untitled page"}</span>
      </span>
    </div>
  );
}
