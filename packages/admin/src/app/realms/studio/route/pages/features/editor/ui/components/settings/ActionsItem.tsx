import { Button } from "@atria/ui";
import * as deps from "../../deps.js";

function ActionsItem({ action, pick, version }: deps.ActionsItemProps) {
  const label = deps.getActionLabel(action.type);
  const time = deps.getActionTimeLabel(action);

  return (
    <Button
      type="button"
      className="pages-actions__action-button"
      onClick={() => pick(version.versionId, action.id)}
    >
      <span className="pages-actions__action-label">{label}</span>
      {time ? <span className="pages-actions__action-time">{time}</span> : null}
    </Button>
  );
}

export { ActionsItem };
