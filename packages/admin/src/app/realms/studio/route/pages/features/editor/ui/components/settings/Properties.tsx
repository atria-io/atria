import * as deps from "../../deps.js";

function Properties() {
  const { panelRef } = deps.useCardCollapse({
    fixedCollapsed: true,
    initialCollapsed: false,
    storageKey: "pages:editor:metadata:properties:collapse",
  });

  return (
    <div ref={panelRef} className="card-panel" data-type="properties">
      <div className="card-strip">
        Properties
      </div>
    </div>
  );
}

export { Properties };
