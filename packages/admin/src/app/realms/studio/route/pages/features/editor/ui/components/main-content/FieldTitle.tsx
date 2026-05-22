import { Input } from "@atria/ui";
import { applySlugFromTitle, parse, setTitle, useState } from "../../deps.js";

function FieldTitle() {
  const { title } = useState();
  const route = parse(window.location.pathname);

  return (
    <div className="pages-editor__field">
      <div className="field field--gap-lg">
        <label className="field__label field--label-sm" htmlFor="page-title">
          Title
        </label>
        <Input
          id="page-title"
          type="text"
          name="title"
          size="sm"
          full
          interactive
          autoFocus={route.mode === "create"}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={applySlugFromTitle}
          placeholder="Page title"
        />
      </div>
    </div>
  );
}

export { FieldTitle };
