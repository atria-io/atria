import * as React from "react";
import { applySlugFromTitle, setTitle, useState } from "../../deps.js";
import { FieldTitle } from "./FieldTitle.js";
import { FieldSlug } from "./FieldSlug.js";
import { FieldContent } from "./FieldContent.js";
import { HeaderTitle } from "./HeaderTitle.js";

function Content() {
  const { title } = useState();
  const [localTitle, setLocalTitle] = React.useState(title);

  React.useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const onTitleBlur = (): void => {
    setTitle(localTitle);
    applySlugFromTitle();
  };

  return (
    <form className="pages-editor__create-form">
      <HeaderTitle title={localTitle} />
      <FieldTitle
        title={localTitle}
        onTitleChange={setLocalTitle}
        onTitleBlur={onTitleBlur}
      />
      <FieldSlug />
      <FieldContent />
    </form>
  );
}

export { Content };
