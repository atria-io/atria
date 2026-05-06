import type { DragEvent } from "react";
import type { FolderNode } from "../pages.types.js";

interface FoldersViewProps {
  folders: FolderNode[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void | Promise<void>;
  onDropPageToFolder: (pageUuid: string, folderId: string | null) => void | Promise<void>;
}

export const FoldersView = ({ folders, selectedFolderId, onSelectFolder, onDropPageToFolder }: FoldersViewProps) => {
  const allowDrop = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
  };
  const readDraggedUuid = (event: DragEvent<HTMLButtonElement>): string | null => {
    const uuid = event.dataTransfer.getData("application/x-page-uuid");
    return uuid.trim() === "" ? null : uuid;
  };

  return (
    <div className="card-screen">
      <div>Folders</div>
      {/*<button
        className="pages-list__item"
        data-active={selectedFolderId === null}
        onDragOver={allowDrop}
        onDrop={(event) => {
          const uuid = readDraggedUuid(event);
          if (uuid) {
            void onDropPageToFolder(uuid, null);
          }
        }}
        onClick={() => onSelectFolder(null)}
        type="button">
        All
      </button>
      {folders.map((folder) => (
        <button
          className="pages-list__item"
          data-active={selectedFolderId === folder.id}
          key={folder.id}
          onDragOver={allowDrop}
          onDrop={(event) => {
            const uuid = readDraggedUuid(event);
            if (uuid) {
              void onDropPageToFolder(uuid, folder.id);
            }
          }}
          onClick={() => onSelectFolder(folder.id)}
          type="button">
          {folder.name}
        </button>
      ))}*/}
    </div>
  );
};
