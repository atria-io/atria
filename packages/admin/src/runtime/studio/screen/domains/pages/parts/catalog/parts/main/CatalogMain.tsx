import { useEditorState } from "../../../editor/services/editorState.js";
import { CatalogDraftItem } from "./draft/CatalogDraftItem.js";

export function CatalogMain() {
  const { drafts } = useEditorState();

  return (
    <div className="pages-catalog__main">
      {drafts.map((item) => (
        <CatalogDraftItem key={item.uuid} item={item} />
      ))}
    </div>
  );
}
