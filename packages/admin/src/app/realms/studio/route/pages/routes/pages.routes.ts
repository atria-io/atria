import * as React from "react";
import { popstate } from "@/app/system/hooks/popstate.js";
import * as state from "../model/pages.state.js";

export const parse = state.parsePagesRoute;
export const createPath = state.resolveCreatePath;
export const docPath = state.resolveDocumentPath;

export const usePathname = (): string => {
  const [pathname, setPathname] = React.useState(
    typeof window === "undefined" ? "/pages" : window.location.pathname
  );

  popstate(() => {
    setPathname(window.location.pathname);
  });

  return pathname;
};
