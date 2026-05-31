import * as deps from "../../deps.js";

function ActionsHeader() {
  const { currentUuid, versionId } = deps.useState();
  const shortDocumentId = currentUuid ? `${currentUuid.slice(0, 8)}...` : "";
  const versionLabel = versionId ? `${shortDocumentId}:${versionId}` : "";

  return (
    <>
      <span>Actions</span>
      <span className="pages-actions__version">
        {versionLabel}
      </span>
    </>
  );
}

export { ActionsHeader };
