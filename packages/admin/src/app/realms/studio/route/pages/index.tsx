import { Catalog } from "./features/catalog/index.js";
import { Editor } from "./features/editor/index.js";
import { Folders } from "./features/folders/index.js";
import { Routes } from "./features/routes/index.js";
import { ArchiveDialog } from "./ui/component/ArchiveDialog.js";
import { DeleteDialog } from "./ui/component/DeleteDialog.js";

export const Pages = () => {
  return (
    <div className="studio-screen__pages">
      <div className="card-layout">
        <div className="card-column" data-zone="pages:a">
          <Folders />
          <Routes />
        </div>
        <div className="card-column" data-zone="pages:b">
          <Catalog />
        </div>
        <div className="card-column" data-zone="pages:c">
          <Editor />
        </div>
      </div>
      <DeleteDialog />
      <ArchiveDialog />
    </div>
  );
};
