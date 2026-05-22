import { useState } from "../../deps.js";
import { FieldTitle } from "./FieldTitle.js";
import { FieldSlug } from "./FieldSlug.js";
import { FieldContent } from "./FieldContent.js";
import { HeaderTitle } from "./HeaderTitle.js";

function Content() {
  const { title } = useState();

  return (
    <form className="pages-editor__create-form">
      <HeaderTitle title={title} />
      <FieldTitle />
      <FieldSlug />
      <FieldContent />
    </form>
  );
}

export { Content };
