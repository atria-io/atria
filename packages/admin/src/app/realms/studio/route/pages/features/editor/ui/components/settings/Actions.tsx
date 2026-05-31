import * as deps from "../../deps.js";
import { ActionsBlock } from "./ActionsBlock.js";
import { ActionsHeader } from "./ActionsHeader.js";

function Actions() {
  const { currentUuid } = deps.useState();
  const { panelRef } = deps.useCardCollapse({
    initialCollapsed: true,
    initialHeightRatio: 0.3,
    clearStyleOnExpand: false,
    expandedMinHeight: 250,
    storageKey: "pages:editor:metadata:actions:collapse",
  });

  return (
    <div ref={panelRef} className="card-panel" data-type="version">
      <div className="card-strip card-strip--resize">
        <ActionsHeader />
      </div>
      <div className="card-stage">
        <div className="pages-actions__body">
          <ActionsBlock key={currentUuid ?? "none"} />
        </div>
      </div>
    </div>
  );
}

export { Actions };
