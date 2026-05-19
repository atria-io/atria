import { Catalog } from "./features/catalog/index.js";
import { Editor } from "./features/editor/index.js";
import { Folders } from "./features/folders/index.js";
import { Routes } from "./features/routes/index.js";
import { DialogDeletePage } from "./shared/ui/DeletePageDialog.js";

export const Pages = () => {
  return (
    <div className="studio-screen__pages">
      <div className="pages-layout">
        <div className="card-column" data-zone="pages:a">
          <div className="card-column__stack" data-group="selector">
            <Folders />
            <Routes />
          </div>
        </div>
        <div className="card-column" data-zone="pages:b">
          <Catalog />
        </div>
        <div className="card-column" data-zone="pages:c">
          <div className="card-column__stack" data-group="editor">
            <Editor />
          </div>
        </div>
      </div>
      <DialogDeletePage />
    </div>
  );
};
