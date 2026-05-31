import * as deps from "./ui/deps.js";
import { Header } from "./ui/header/components/Header.js";

function Folders() {
  const { panelRef } = deps.useCardCollapse({
    fixedCollapsed: true,
    initialCollapsed: false,
    storageKey: "pages:folders:collapse",
  });

  return (
    <div ref={panelRef} className="card-panel" data-type="folders">
      <div className="card-strip card-strip--resize">
        <Header />
      </div>
    </div>
  );
}

export { Folders };
