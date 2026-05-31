import * as React from "react";
import * as Icon from "lucide-react";
import * as deps from "../../deps.js";
import { Button, Input } from "@atria/ui";

function InputSearch() {
  const { searchTerm } = deps.use();

  const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    deps.setSearch(event.target.value);
  };

  return (
    <>
      <Button
        type="button"
        square
        icon
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
        value={searchTerm}
        onChange={onChange}
      />
    </>
  );
}

export { InputSearch };
