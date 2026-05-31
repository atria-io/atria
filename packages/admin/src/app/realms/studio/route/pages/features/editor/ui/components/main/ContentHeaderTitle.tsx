import * as React from "react";
import * as deps from "../../deps.js";

function ContentHeaderTitle() {
  const { title } = deps.useState();
  const [previewTitle, setPreviewTitle] = React.useState(title);

  React.useEffect(() => {
    setPreviewTitle(title);
  }, [title]);

  React.useEffect(() => {
    const input = document.getElementById("page-title");
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const onInput = (): void => {
      setPreviewTitle(input.value);
    };

    input.addEventListener("input", onInput);
    return () => {
      input.removeEventListener("input", onInput);
    };
  }, []);

  const truncatedTitle = previewTitle.length > 48
    ? `${previewTitle.slice(0, 48)}…`
    : previewTitle;
  return (
    <div className="pages-editor__title">
      <span title={previewTitle}>
        {previewTitle.trim() ? truncatedTitle : "Untitled"}
      </span>
    </div>
  );
}

export { ContentHeaderTitle };
