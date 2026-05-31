import * as deps from "../../deps.js";

function Status() {
  const { canonicalStatus, versionId } = deps.useState();
  const editLabel = canonicalStatus === "published" && versionId
    ? "Editing draft"
    : null;

  return (
    <>
      {editLabel ?
        <div className="pages-editor__badge">
          <span>{editLabel}</span>
        </div>
      : null}
    </>
  );
}

export { Status };
