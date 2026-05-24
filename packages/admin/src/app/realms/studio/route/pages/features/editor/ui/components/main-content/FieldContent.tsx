import { Textarea } from "@atria/ui";
import { setContent, useState } from "../../deps.js";

function FieldContent() {
  const { content } = useState();

  return (
    <div className="pages-editor__field">
      <div className="field field--gap-lg">
        <label className="field__label field--label-sm" htmlFor="page-content">
          Content
        </label>
        <Textarea
          id="page-content"
          name="content"
          rows={12}
          full
          interactive
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Page content"
        />
      </div>
    </div>
  );
}

export { FieldContent };
