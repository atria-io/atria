import { useEffect, useState } from "react";

export const isCreatePath = (
  pathname: string
): boolean => pathname.endsWith(";create");

export const resolveCreatePath = (
  pathname: string
): string => {
  if (isCreatePath(pathname)) {
    return pathname;
  }

  return pathname === "/pages" ? "/pages;create" : pathname + ";create";
};

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
