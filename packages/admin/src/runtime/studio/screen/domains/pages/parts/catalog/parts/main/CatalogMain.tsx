import { useEditorState } from "../../../editor/services/editorState.js";
import { parsePagesRoute, usePagesPathname } from "../../../../services/state/pagesState.js";
import { CatalogDraftItem } from "./draft/CatalogDraftItem.js";

export function CatalogMain() {
  const { drafts } = useEditorState();
  const pathname = usePagesPathname();
  const route = parsePagesRoute(pathname);

  return (
    <div className="pages-catalog__main">
      {drafts.map((item) => (
        <CatalogDraftItem
          key={item.uuid}
          item={item}
          active={route.mode === "document" && route.uuid === item.uuid}
        />
      ))}
    </div>
  );
}
