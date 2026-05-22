import * as React from "react";
import * as Icon from "lucide-react";
import { type CatalogItem as CatalogItemType } from "../../../../editor/model/editor.state.js";
import { resolveDocumentPath } from "../../../../../routes/pages.routes.js";

interface CatalogItemProps {
  item: CatalogItemType;
  active: boolean;
}

export function CatalogItem({ item, active }: CatalogItemProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const statusLabel = item.status === "published"
    ? "Online"
    : item.status === "archived"
      ? "Archived"
      : "Draft";
  const statusClassName = item.status === "published"
    ? "pages-catalog__item-status pages-catalog__item-status--online"
    : "pages-catalog__item-status pages-catalog__item-status--draft";

  React.useEffect(() => {
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

  const onOpenItem = (event: React.MouseEvent<HTMLDivElement>): void => {
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
        <Icon.Dot size={16} />
      </span>
      <span className="pages-catalog__item-title">
        <span>{item.title.trim() || "Untitled"}</span>
      </span>
    </div>
  );
}
