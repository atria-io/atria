import { useEditorState } from "../../../editor/services/editorState.js";
import { parsePagesRoute, usePagesPathname } from "../../../../services/state/pagesState.js";
import { CatalogItem } from "./CatalogItem.js";

export function CatalogMain() {
  const { drafts } = useEditorState();
  const pathname = usePagesPathname();
  const route = parsePagesRoute(pathname);

  return (
    <div className="pages-catalog__main">
      {drafts.map((item) => (
        <CatalogItem
          key={item.uuid}
          item={item}
          active={route.mode === "document" && route.uuid === item.uuid}
        />
      ))}
    </div>
  );
}
