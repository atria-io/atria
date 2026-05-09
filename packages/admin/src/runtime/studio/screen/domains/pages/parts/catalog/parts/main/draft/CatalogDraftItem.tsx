import type { MouseEvent } from "react";
import { useEffect, useRef } from "react";
import { Dot } from "lucide-react";
import type { CatalogDraftItem as CatalogDraftItemType } from "../../../../editor/services/editorState.js";
import { resolveDocumentPath } from "../../../../../services/state/pagesState.js";

interface CatalogDraftItemProps {
  item: CatalogDraftItemType;
  active: boolean;
}

export function CatalogDraftItem({ item, active }: CatalogDraftItemProps) {
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

  const onOpenDraft = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
    window.history.pushState({}, "", resolveDocumentPath(item.uuid));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      className="pages-catalog__item"
      key={item.uuid}
      onClick={onOpenDraft}
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
