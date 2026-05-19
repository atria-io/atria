import * as React from "react";
import * as Icon from "lucide-react";
import {
  archiveEditorPage,
  publishEditorPage,
  unpublishEditorPage,
  type CatalogItem as CatalogItemType
} from "../../editor/model/editor.state.js";
import { resolveDocumentPath } from "../../../routes/pages.routes.js";
import { ActionsMore } from "../../../shared/ui/ActionsMore.js";
import { openDeletePage } from "../../../shared/ui/DeletePageDialog.js";

interface CatalogItemProps {
  item: CatalogItemType;
  active: boolean;
}

export function CatalogItem({ item, active }: CatalogItemProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [moreOpen, setMoreOpen] = React.useState(false);
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

  const runItemAction = (action: () => void) => (): void => {
    window.history.pushState({}, "", resolveDocumentPath(item.uuid));
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.setTimeout(action, 0);
  };

  return (
    <div
      className="pages-catalog__item"
      key={item.uuid}
      onClick={onOpenItem}
      data-more-open={moreOpen ? "true" : undefined}
      ref={rootRef}
    >
      <span className={statusClassName} aria-label={statusLabel} title={statusLabel}>
        <Icon.Dot size={16} />
      </span>
      <span className="pages-catalog__item-title">
        <span>{item.title.trim() || "Untitled page"}</span>
      </span>
      <div className="pages-catalog__show-more">
        <ActionsMore
          panelId={`pages-catalog-more-panel-menu-${item.uuid}`}
          variant="catalog"
          stopPropagation
          onOpenChange={setMoreOpen}
          items={[
            item.status === "archived"
              ? { key: "unarchive", label: "Unarchive", icon: Icon.Upload, onClick: runItemAction(unpublishEditorPage) }
              : { key: "archive", label: "Archive", icon: Icon.Archive, onClick: runItemAction(archiveEditorPage) },
            {
              key: "publish",
              label: "Publish",
              icon: Icon.Upload,
              hidden: item.status === "published",
              onClick: runItemAction(publishEditorPage),
            },
            {
              key: "unpublish",
              label: "Unpublish",
              icon: Icon.EyeOff,
              hidden: item.status !== "published",
              onClick: runItemAction(unpublishEditorPage),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Icon.Trash2,
              danger: true,
              onClick: () => openDeletePage(item.uuid, item.title),
            },
          ]}
        />
      </div>
    </div>
  );
}
