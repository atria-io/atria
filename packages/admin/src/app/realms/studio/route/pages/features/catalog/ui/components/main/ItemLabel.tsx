import * as Icon from "lucide-react";
import type { CatalogItem } from "../../deps.js";

interface LabelProps {
  item: CatalogItem;
}

function ItemLabel({ item }: LabelProps) {
  const statusLabel = item.status === "published"
    ? "Live"
    : item.status === "archived"
      ? "Archived"
      : "Draft";
  const statusClassName = item.status === "published"
    ? "pages-catalog__item-status pages-catalog__item-status--live"
    : "pages-catalog__item-status pages-catalog__item-status--draft";
  const title = item.title.trim() || "Untitled";
  const truncatedTitle = title.length > 25
    ? `${title.slice(0, 25)}…`
    : title;

  return (
    <>
      <span className={statusClassName} aria-label={statusLabel} title={statusLabel}>
        <Icon.Dot size={16} />
      </span>
      <span className="pages-catalog__item-title">
        <span title={title}>{truncatedTitle}</span>
      </span>
    </>
  );
}

export { ItemLabel };
