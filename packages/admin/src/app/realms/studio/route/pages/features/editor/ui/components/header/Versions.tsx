import * as deps from "../../deps.js";

function Versions() {
  const { versionId } = deps.useState();
  const versionLabel = versionId ? `Version: ${versionId}` : null;

  return (
    <div className="pages-editor__version" title="Editor version">
      {versionLabel ? <span>{versionLabel}</span> : null}
    </div>
  );
}

export { Versions };
