import * as deps from "../../deps.js";

function Status() {
  const { canonicalStatus } = deps.useState();

  const status = canonicalStatus === "archived"
      ? "Archived"
      : canonicalStatus === "draft"
        ? "Draft"
      : "Live";
  const className = status === "Live"
    ? "pages-editor__status pages-editor__status--live"
    : status === "Archived"
      ? "pages-editor__status pages-editor__status--archived"
      : "pages-editor__status pages-editor__status--draft";

  return (
    <div className={className}>
      {status}
    </div>
  );
}

export { Status };
