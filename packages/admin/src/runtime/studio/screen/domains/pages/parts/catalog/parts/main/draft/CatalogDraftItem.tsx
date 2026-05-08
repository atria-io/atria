import { Dot } from "lucide-react";
import type { CatalogDraftItem as CatalogDraftItemType } from "../../../../editor/services/editorState.js";

interface CatalogDraftItemProps {
  item: CatalogDraftItemType;
}

export function CatalogDraftItem({ item }: CatalogDraftItemProps) {
  return (
    <div className="pages-catalog__item" key={item.uuid}>
      <span className="pages-catalog__item-status" aria-label={item.status} title={item.status}>
        <Dot size={16} />
      </span>
      <span className="pages_catalog__item-title">
        <span>{item.title.trim() || "Untitled page"}</span>
      </span>
    </div>
  );
}
