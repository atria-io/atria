import { CatalogView } from "./parts/catalog/CatalogView.js";
import { EditorView } from "./parts/editor/EditorView.js";
import { FoldersView } from "./parts/folders/FoldersView.js";
import { RoutesView } from "./parts/routes/RoutesView.js";
import { DeletePageConfirm } from "./shared/delete-confirm/DeletePageConfirm.js";

export const PagesView = () => {
  return (
    <div className="studio-screen__pages">
      <div className="pages-layout">
        <div className="card-column" data-zone="pages:a">
          <div className="card-column__stack" data-group="selector">
            <FoldersView />
            <RoutesView />
          </div>
        </div>
        <div className="card-column" data-zone="pages:b">
          <CatalogView />
        </div>
        <div className="card-column" data-zone="pages:c">
          <div className="card-column__stack" data-group="editor">
            <EditorView />
          </div>
        </div>
      </div>
      <DeletePageConfirm />
    </div>
  );
};
