import * as Icon from "lucide-react";
import * as deps from "../../deps.js";

interface LabelProps {
  item: deps.CatalogItem;
  status?: "draft" | "published" | "archived";
}

function ItemLabel({ item, status }: LabelProps) {
  const effectiveStatus = status ?? item.status;
  const isPublished = effectiveStatus === "published";
  const isArchived = effectiveStatus === "archived";
  const statusLabel = isPublished ? "Live" : isArchived ? "Archived" : "Draft";
  const statusClassName = isPublished
    ? "pages-catalog__item-status pages-catalog__item-status--live"
    : isArchived
      ? "pages-catalog__item-status pages-catalog__item-status--archived"
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
