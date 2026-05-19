import { useEditorState } from "../../editor/model/editor.state.js";
import { parsePagesRoute, usePagesPathname } from "../../../routes/pages.routes.js";
import { useCatalogFilterState } from "../model/catalog.state.js";
import { CatalogItem } from "./CatalogItem.js";

export function CatalogMain() {
  const { drafts } = useEditorState();
  const { archivedOnly } = useCatalogFilterState();
  const pathname = usePagesPathname();
  const route = parsePagesRoute(pathname);
  const items = drafts.filter((item) =>
    archivedOnly ? item.status === "archived" : item.status !== "archived"
  );

  return (
    <div className="pages-catalog__main">
      {items.map((item) => (
        <CatalogItem
          key={item.uuid}
          item={item}
          active={route.mode === "document" && route.uuid === item.uuid}
        />
      ))}
    </div>
  );
}
