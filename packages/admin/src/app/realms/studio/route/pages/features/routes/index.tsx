import * as deps from "./ui/deps.js";
import { Header } from "./ui/header/components/Header.js";

function Routes() {
  const { panelRef } = deps.useCardCollapse({
    initialCollapsed: false,
    initialHeightRatio: 0.7,
    storageKey: "pages:routes:collapse",
  });

  return (
    <div ref={panelRef} className="card-panel" data-type="routes">
      <div className="card-strip card-strip--resize">
        <Header />
      </div>
    </div>
  );
}

export { Routes };
