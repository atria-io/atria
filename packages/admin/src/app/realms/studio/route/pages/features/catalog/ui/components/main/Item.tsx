import * as React from "react";
import * as Icon from "lucide-react";
import * as deps from "../../deps.js";

interface CatalogItemProps {
  item: deps.CatalogItem;
  active: boolean;
}

function Item({ item, active }: CatalogItemProps) {
  const rootRef = React.useRef<HTMLLIElement | null>(null);
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

  const onOpenItem = (event: React.MouseEvent<HTMLLIElement>): void => {
    event.stopPropagation();
    window.history.pushState({}, "", deps.docPath(item.uuid));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <li
      className="pages-catalog__item"
      onClick={onOpenItem}
      ref={rootRef}
    >
      <span className={statusClassName} aria-label={statusLabel} title={statusLabel}>
        <Icon.Dot size={16} />
      </span>
      <span className="pages-catalog__item-title">
        <span>{item.title.trim() || "Untitled"}</span>
      </span>
    </li>
  );
}

export { Item };
