import { Button } from "@atria/ui";
import * as deps from "../../deps.js";
import { ActionsBranch } from "./ActionsBranch.js";
import { ActionsList } from "./ActionsList.js";
import { ActionsConnector } from "./ActionsConnector.js";

function ActionsBlock() {
  const { versions, actionId, ready, pick } = deps.useActionsBodyModel();
  const connector = ActionsConnector(versions, actionId);

  if (!ready) {
    return null;
  }

  function pickLatest(version: deps.ActionsBodyVersion): void {
    const latest = version.actions[0];
    if (!latest) {
      return;
    }

    pick(version.versionId, latest.id);
  }

  return versions.map((version) => (
    <div
      key={version.versionId}
      className={version.isCurrent ? "pages-actions__version-block pages-actions__version-block--active" : "pages-actions__version-block"}
      ref={connector.bind(version.versionId)}
    >
      {connector.view(version.versionId, version.isCurrent)}
      <Button
        type="button"
        className="pages-actions__branch"
        onClick={() => pickLatest(version)}
      >
        <ActionsBranch version={version} />
      </Button>
      <ol className="pages-actions__actions">
        <ActionsList actionId={actionId} pick={pick} version={version} />
      </ol>
    </div>
  ));
}

export { ActionsBlock };
