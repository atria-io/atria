import * as React from "react";
import { parsePagesRoute, resolveCreatePath, resolveDocumentPath } from "../model/pages.state.js";

export { parsePagesRoute, resolveCreatePath, resolveDocumentPath };

export const usePagesPathname = (): string => {
  const [pathname, setPathname] = React.useState(
    typeof window === "undefined" ? "/pages" : window.location.pathname
  );

  React.useEffect(() => {
    const onPopState = (): void => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return pathname;
};
