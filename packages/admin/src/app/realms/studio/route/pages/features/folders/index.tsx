import { FoldersHeader } from "./ui/FoldersHeader.js";

export function Folders() {
  return (
    <div className="card-column__item" data-type="folders">
      <div className="card-screen">
        <FoldersHeader />
      </div>
    </div>
  );
}
