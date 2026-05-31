import { ContentFieldTitle } from "./ContentFieldTitle.js";
import { ContentFieldSlug } from "./ContentFieldSlug.js";
import { ContentFieldContent } from "./ContentFieldContent.js";
import { ContentHeaderTitle } from "./ContentHeaderTitle.js";

function Content() {
  return (
    <form>
      <ContentHeaderTitle />
      <ContentFieldTitle />
      <ContentFieldSlug />
      <ContentFieldContent />
    </form>
  );
}

export { Content };
