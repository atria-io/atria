import { Plus } from "lucide-react";
import type { HeaderProps } from "./types.js";

export function Header({ onCreatePage }: HeaderProps) {
  return (
    <>
      <div className="card-screen">
        <div className="catalog-header">
          <div>Catalog</div>
          <button
            type="button"
            className="button button--square button--overlay button--has-icon catalog-header__action"
            aria-label="New Page"
            data-tooltip="New Page"
            onClick={onCreatePage}
          >
            <div className="button__icon">
              <Plus size={16} />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
