import { FoldersHeader } from "./parts/header/FoldersHeader.js";

export function FoldersView() {
  return (
    <div className="card-column__item" data-type="folders">
      <div className="card-screen">
        <FoldersHeader />
      </div>
    </div>
  );
}
