import type { MouseEvent } from "react";
import { useEffect, useRef } from "react";
import { Archive, Dot, EyeOff, Trash2, Upload } from "lucide-react";
import type { CatalogItem as CatalogItemType } from "../../../editor/services/editorState.js";
import { resolveDocumentPath } from "../../../../services/state/pagesState.js";
import { ActionsMore } from "../../../../shared/actions-more/ActionsMore.js";

interface CatalogItemProps {
  item: CatalogItemType;
  active: boolean;
}

export function CatalogItem({ item, active }: CatalogItemProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const statusLabel = item.status === "published"
    ? "Online"
    : item.status === "archived"
      ? "Archived"
      : "Draft";
  const statusClassName = item.status === "published"
    ? "pages-catalog__item-status pages-catalog__item-status--online"
    : "pages-catalog__item-status pages-catalog__item-status--draft";

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

  const onHoverItem = (): void => {
    window.dispatchEvent(new CustomEvent("atria:pages:catalog-hover", { detail: { key: item.uuid } }));
  };

  return (
    <div
      className="pages-catalog__item"
      key={item.uuid}
      onClick={onOpenItem}
      onMouseEnter={onHoverItem}
      ref={rootRef}
    >
      <span className={statusClassName} aria-label={statusLabel} title={statusLabel}>
        <Dot size={16} />
      </span>
      <span className="pages-catalog__item-title">
        <span>{item.title.trim() || "Untitled page"}</span>
      </span>
      <div className="pages-catalog__show-more">
        <ActionsMore
          panelId={`pages-catalog-more-panel-menu-${item.uuid}`}
          variant="catalog"
          stopPropagation
          catalogItemKey={item.uuid}
          items={[
            item.status === "archived"
              ? { key: "unarchive", label: "Unarchive", icon: Upload }
              : { key: "archive", label: "Archive", icon: Archive },
            { key: "unpublish", label: "Unpublish", icon: EyeOff, hidden: item.status === "archived" },
            { key: "delete", label: "Delete", icon: Trash2, danger: true },
          ]}
        />
      </div>
    </div>
  );
}
