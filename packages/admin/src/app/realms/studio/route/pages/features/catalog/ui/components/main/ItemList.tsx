import * as React from "react";
import * as deps from "../../deps.js";
import { ActionsMore } from "./ActionsMore.js";
import { ItemLabel } from "./ItemLabel.js";

interface CatalogItemProps {
  item: deps.CatalogItem;
  active: boolean;
}

interface ItemRootProps {
  className: string;
  item: deps.CatalogItem;
  active: boolean;
  children: React.ReactNode;
}

function ItemRoot({ className, item, active, children }: ItemRootProps) {
  const rootRef = React.useRef<HTMLLIElement | null>(null);

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
    <li className={className} onClick={onOpenItem} ref={rootRef}>
      <div className="pages-catalog__item-row">
        {children}
      </div>
    </li>
  );
}

function Item({ item, active }: CatalogItemProps) {
  return (
    <ItemRoot className="pages-catalog__item" item={item} active={active}>
      <div className="pages-catalog__item-label">
        <ItemLabel item={item} />
      </div>
      <div className="pages-catalog__item-actions">
        <ActionsMore item={item} />
      </div>
    </ItemRoot>
  );
}

export { Item };
