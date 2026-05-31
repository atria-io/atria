import * as React from "react";
import { Input } from "@atria/ui";
import * as deps from "../../deps.js";

function ContentFieldTitle() {
  const { title } = deps.useState();
  const route = deps.parse(window.location.pathname);
  const [localTitle, setLocalTitle] = React.useState(title);
  const didAutoFocusRef = React.useRef(false);
  const committedOnTabRef = React.useRef(false);

  React.useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  React.useEffect(() => {
    if (route.mode !== "create" || didAutoFocusRef.current) {
      return;
    }
    didAutoFocusRef.current = true;
    const input = document.getElementById("page-title") as HTMLInputElement | null;
    input?.focus();
  }, [route.mode]);

  const commit = (): void => {
    const nextTitle = localTitle.trim();
    setLocalTitle(nextTitle);

    if (route.mode === "create") {
      deps.commitTitleBlurOnCreate(nextTitle);
      return;
    }

    deps.setTitle(nextTitle);
    deps.commitEditorChanges();
  };

  const onBlur = (): void => {
    if (committedOnTabRef.current) {
      committedOnTabRef.current = false;
      return;
    }
    commit();
  };

  return (
    <div className="pages-editor__field">
      <div className="field field--gap-lg">
        <label className="field__label" htmlFor="page-title">
          Title
        </label>
        <Input
          id="page-title"
          type="text"
          name="title"
          size="sm"
          full
          interactive
          value={localTitle}
          onChange={(event) => {
            const value = event.target.value;
            setLocalTitle(value);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Tab") {
              return;
            }
            committedOnTabRef.current = true;
            commit();
          }}
          onBlur={onBlur}
          placeholder="Page title"
        />
      </div>
    </div>
  );
}

export { ContentFieldTitle };
