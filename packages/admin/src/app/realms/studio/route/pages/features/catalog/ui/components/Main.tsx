import * as deps from "../deps.js";
import { Item } from "./main/Item.js";

function Main() {
  const { drafts } = deps.useState();
  const { archivedOnly } = deps.useFilter();
  const pathname = deps.usePathname();
  const route = deps.parse(pathname);
  const items = drafts.filter((item) =>
    archivedOnly ? item.status === "archived" : item.status !== "archived"
  );

  return (
    <div className="pages-catalog__main">
      {items.map((item) => (
        <Item
          key={item.uuid}
          item={item}
          active={route.mode === "document" && route.uuid === item.uuid}
        />
      ))}
    </div>
  );
}

export { Main };
