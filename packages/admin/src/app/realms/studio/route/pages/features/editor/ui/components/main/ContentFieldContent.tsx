import * as React from "react";
import { Textarea } from "@atria/ui";
import * as deps from "../../deps.js";

function ContentFieldContent() {
  const { content } = deps.useState();
  const [localContent, setLocalContent] = React.useState(content);
  const committedOnTabRef = React.useRef(false);

  React.useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const commit = (): void => {
    deps.setContent(localContent);
    deps.commitEditorChanges();
  };

  return (
    <div className="pages-editor__field">
      <div className="field field--gap-lg">
        <label className="field__label" htmlFor="page-content">
          Content
        </label>
        <Textarea
          id="page-content"
          name="content"
          rows={12}
          full
          interactive
          value={localContent}
          onChange={(event) => setLocalContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Tab") {
              return;
            }
            committedOnTabRef.current = true;
            commit();
          }}
          onBlur={() => {
            if (committedOnTabRef.current) {
              committedOnTabRef.current = false;
              return;
            }
            commit();
          }}
          placeholder="Page content"
        />
      </div>
    </div>
  );
}

export { ContentFieldContent };
