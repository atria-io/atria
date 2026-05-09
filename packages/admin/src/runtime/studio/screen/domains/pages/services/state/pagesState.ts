import { useEffect, useState } from "react";

export type PagesRouteMode = "browse" | "create" | "document";

export interface PagesRouteState {
  mode: PagesRouteMode;
  uuid: string | null;
}

const toNonEmpty = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export const parsePagesRoute = (pathname: string): PagesRouteState => {
  if (!pathname.startsWith("/pages")) {
    return { mode: "browse", uuid: null };
  }

  const matrix = pathname.slice("/pages".length);
  if (matrix === ";create") {
    return { mode: "create", uuid: null };
  }

  if (matrix.startsWith(";")) {
    const uuid = toNonEmpty(matrix.slice(1));
    if (!uuid) {
      return { mode: "browse", uuid: null };
    }

    return { mode: "document", uuid };
  }

  return { mode: "browse", uuid: null };
};

export const resolveCreatePath = (pathname: string): string => {
  const route = parsePagesRoute(pathname);
  if (route.mode === "create") {
    return pathname;
  }

  return "/pages;create";
};

export const resolveDocumentPath = (uuid: string): string => `/pages;${uuid}`;

export const usePagesPathname = (): string => {
  const [pathname, setPathname] = useState(
    typeof window === "undefined" ? "/pages" : window.location.pathname
  );

  useEffect(() => {
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
