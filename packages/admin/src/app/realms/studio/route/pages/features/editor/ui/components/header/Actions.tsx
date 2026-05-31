import * as deps from "../../deps.js";
import { ActionsMore } from "./ActionsMore.js";
import { Publish } from "./Publish.js";
import { Status } from "./Status.js";
import { Versions } from "./Versions.js";

function Actions() {
  const { creating } = deps.useState();

  if (!creating) {
    return null;
  }

  return (
    <div>
      <Versions />
      <div className="pages-editor__state">
        <Status />
        <Publish />
      </div>
      <ActionsMore />
    </div>
  );
}

export { Actions };
