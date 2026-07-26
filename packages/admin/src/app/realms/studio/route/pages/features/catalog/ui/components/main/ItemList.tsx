import * as React from "react";
import * as deps from "../../deps.js";
import { ActionsMore } from "./ActionsMore.js";
import { ItemLabel } from "./ItemLabel.js";

interface CatalogItemProps {
  item: deps.CatalogItem;
  active: boolean;
}

function ItemList({ item, active }: CatalogItemProps) {
  const { canonicalStatus, currentUuid, historyByPage, versionId } = deps.useState();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLLIElement | null>(null);
  let status: "draft" | "published" | "archived" | undefined;

  if (currentUuid === item.uuid) {
    if (canonicalStatus === "archived") {
      status = "archived";
    } else if (canonicalStatus !== "published") {
      status = "draft";
    } else if (!versionId) {
      status = "published";
    } else {
      const versions = historyByPage[item.uuid]?.versions ?? [];
      const currentVersion = versions.find((version) => version.versionId === versionId);
      status = currentVersion?.live ? "published" : "draft";
    }
  }

  React.useEffect(() => {
    if (active) {
      return;
    }

    setOpen(false);
  }, [active]);

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

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    if (open) {
      root.setAttribute("open", "");
      return;
    }

    root.removeAttribute("open");
  }, [open]);

  const onOpenItem = (event: React.MouseEvent<HTMLLIElement>): void => {
    event.stopPropagation();
    if (active) {
      return;
    }
    window.history.pushState({}, "", deps.docPath(item.uuid));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <li className="pages-catalog__item" onClick={onOpenItem} ref={rootRef}>
      <div className="pages-catalog__item-row">
        <div className="pages-catalog__item-label">
          <ItemLabel item={item} status={status} />
        </div>
        <div className="pages-catalog__item-actions">
          <ActionsMore item={item} onOpenChange={setOpen} />
        </div>
      </div>
    </li>
  );
}

export { ItemList };
