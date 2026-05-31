import * as deps from "../../deps.js";

function Actions() {
  return (
    <>
      <div>Folders</div>
      <div className="pages-folders__header-action">
        <deps.Button
          type="button"
          variant="overlay"
          square
          icon
          className="pages-catalog__action--create"
          aria-label="Add Folder"
          data-tooltip="Add Folder"
        >
          <deps.Icon.Plus size={16} />
        </deps.Button>
      </div>
    </>
  );
}

export { Actions };
