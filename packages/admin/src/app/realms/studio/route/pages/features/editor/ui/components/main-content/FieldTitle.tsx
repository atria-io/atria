import { Input } from "@atria/ui";
import { applySlugFromTitle, setTitle, useState } from "../../deps.js";

function FieldTitle() {
  const { title } = useState();

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
