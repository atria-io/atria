import * as deps from "../../deps.js";

function ActionsBranch({
  version,
}: deps.ActionsBranchViewProps) {
  return (
    <>
      <span className="pages-actions__branch-version">
        {`:${version.versionId}`}
      </span>
      <span className={version.isCurrent && version.branchState === "LIVE"
        ? "pages-actions__branch-state pages-actions__branch-state--active"
        : "pages-actions__branch-state"}
      >
        {version.branchState}
      </span>
    </>
  );
}

export { ActionsBranch };
