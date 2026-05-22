import * as Icon from "lucide-react";
import { Button, Input } from "@atria/ui";

function Search() {
  return (
    <div className="pages-catalog__search">
      <Button
        type="button"
        square
        icon
        className="pages-catalog__search-action"
        aria-label="Search"
      >
        <Icon.Search size={13} />
      </Button>
      <Input
        id="page-search"
        name="search"
        type="text"
        size="sm"
        full
        className="input--subtle input--focus-line"
        aria-label="Search pages"
        placeholder="Search pages..."
      />
    </div>
  );
}

export { Search };
