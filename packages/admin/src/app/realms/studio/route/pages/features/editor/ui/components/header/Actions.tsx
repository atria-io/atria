import { useState } from "../../deps.js";
import { ActionsMore } from "./ActionsMore.js";
import { Publish } from "./Publish.js";
import { Status } from "./Status.js";

export function Actions() {
  const { creating } = useState();

  if (!creating) {
    return null;
  }

  return (
    <div className="pages-editor__header-actions">
      <ActionsMore />
      <Status />
      <Publish />
    </div>
  );
}
