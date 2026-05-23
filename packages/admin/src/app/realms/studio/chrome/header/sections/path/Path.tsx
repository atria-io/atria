import type { State } from "@/app/realms/studio/model/studio.types.js";
import { parsePagesRoute } from "@/app/realms/studio/route/pages/model/pages.state.js";
import { useState } from "@/app/realms/studio/route/pages/features/editor/model/editor.state.js";

export interface PathProps {
  screen: State;
}

const toCapitalized = (
  value: string
): string =>
  value[0].toUpperCase() + value.slice(1);

function Path({ screen }: PathProps) {
  if (screen === "dashboard") {
    return <strong>@studio</strong>;
  }

  if (screen === "pages") {
    const route = parsePagesRoute(window.location.pathname);
    const { drafts } = useState();
    const title = route.mode === "document"
      ? drafts.find((item) => item.uuid === route.uuid)?.title.trim() || "Untitled"
      : null;

    return (
      <>
        {/*<strong><a href="/">@</a></strong>*/}
        <span> / </span>
        <span>Pages</span>
        {title ? (
          <>
            <span> / </span>
            <span>{title}</span>
          </>
        ) : null}
      </>
    );
  }

  return (
    <>
      {/*<strong><a href="/">@</a></strong>*/}
      <span> / </span>
      {toCapitalized(screen)}
    </>
  );
}

export { Path };
