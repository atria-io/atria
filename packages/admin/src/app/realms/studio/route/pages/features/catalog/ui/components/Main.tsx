import * as React from "react";
import * as deps from "../deps.js";
import { ItemList } from "./main/ItemList.js";

function Main() {
  const { drafts } = deps.useState();
  const { archivedOnly, searchTerm } = deps.use();
  const pathname = deps.usePathname();
  React.useEffect(() => {
    deps.syncScope(pathname);
  }, [pathname]);
  const route = deps.parse(pathname);
  const query = searchTerm.trim().toLowerCase();

  const items = drafts.filter((item) =>
    (archivedOnly ? item.status === "archived" : item.status !== "archived") &&
    (!query ||
      item.title.toLowerCase().includes(query) ||
      item.slug.toLowerCase().includes(query))
  );

  return (
    <ol className="pages-catalog__main">
      {items.map((item) => (
        <ItemList
          key={item.uuid}
          item={item}
          active={route.mode === "document" && route.uuid === item.uuid}
        />
      ))}
    </ol>
  );
}

export { Main };
