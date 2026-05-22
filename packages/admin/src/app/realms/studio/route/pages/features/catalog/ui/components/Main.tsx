import * as deps from "../deps.js";
import { Item } from "./main/Item.js";

function Main() {
  const { drafts } = deps.useState();
  const { archivedOnly, searchTerm } = deps.useFilter();
  const pathname = deps.usePathname();
  const route = deps.parse(pathname);
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const shouldSearch = normalizedQuery.length >= 1;

  const items = drafts.filter((item) =>
    (archivedOnly ? item.status === "archived" : item.status !== "archived") &&
    (!shouldSearch ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.slug.toLowerCase().includes(normalizedQuery))
  );

  return (
    <ol className="pages-catalog__main">
      {items.map((item) => (
        <Item
          key={item.uuid}
          item={item}
          active={route.mode === "document" && route.uuid === item.uuid}
        />
      ))}
    </ol>
  );
}

export { Main };
