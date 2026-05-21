import * as React from "react";
import { popstate } from "@/app/system/hooks/popstate.js";
import * as state from "../model/pages.state.js";

export const parsePagesRoute = state.parsePagesRoute;
export const resolveCreatePath = state.resolveCreatePath;
export const resolveDocumentPath = state.resolveDocumentPath;

export const usePagesPathname = (): string => {
  const [pathname, setPathname] = React.useState(
    typeof window === "undefined" ? "/pages" : window.location.pathname
  );

  popstate(() => {
    setPathname(window.location.pathname);
  });

  return pathname;
};
