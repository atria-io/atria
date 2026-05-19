import { useEditorState } from "../../../editor/services/editorState.js";
import { parsePagesRoute, usePagesPathname } from "../../../../services/state/pagesState.js";
import { useCatalogFilterState } from "../../services/state/catalogFilterState.js";
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
