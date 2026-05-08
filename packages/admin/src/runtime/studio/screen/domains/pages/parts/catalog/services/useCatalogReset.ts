import type { MouseEvent } from "react";
import * as ps from "../../../services/state/pagesState.js";

export const useCatalogReset = () => {
  const onCatalogClick = (event: MouseEvent<HTMLDivElement>): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("button,input,textarea,select,a,label")) {
      return;
    }

    const route = ps.parsePagesRoute(window.location.pathname);
    if (route.mode !== "document") {
      return;
    }

    window.history.pushState({}, "", "/pages");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return { onCatalogClick };
};
