import { useEffect, useState } from "react";
import { CatalogView } from "./parts/catalog/CatalogView.js";
import { EditorView } from "./parts/editor/EditorView.js";
import { FoldersView } from "./parts/folders/FoldersView.js";
import { RoutesView } from "./parts/routes/RoutesView.js";

const CREATE_SEGMENTS = [";create", ":create"];

const isCreatePath = (pathname: string): boolean =>
  CREATE_SEGMENTS.some((segment) => pathname.endsWith(segment));

const resolvePagesPath = (pathname: string): string => {
  if (isCreatePath(pathname)) {
    return pathname;
  }

  return pathname === "/pages" ? "/pages;create" : pathname + ";create";
};

export const PagesView = () => {
  const [pathname, setPathname] = useState<string>(
    typeof window === "undefined" ? "/pages" : window.location.pathname
  );
  const creating = isCreatePath(pathname);

  useEffect(() => {
    const handlePopState = (): void => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleCreatePage = (): void => {
    const nextPath = resolvePagesPath(window.location.pathname);
    window.history.pushState({}, "", nextPath);
    setPathname(nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="studio-screen__pages">
      <div className="pages-layout">
        <div className="card-column" data-zone="pages:a">
          <div className="card-column__stack" data-group="selector">
            <FoldersView />
            <RoutesView />
          </div>
        </div>
        <div className="card-column" data-zone="pages:b">
          <CatalogView onCreatePage={handleCreatePage} />
        </div>
        <div className="card-column" data-zone="pages:c">
          <EditorView creating={creating} />
        </div>
      </div>
    </div>
  );
};
