import * as deps from "../../deps.js";

export interface PathProps {
  screen: deps.State;
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
    const route = deps.parsePagesRoute(window.location.pathname);
    const { creating, currentUuid, title: currentTitle, drafts } = deps.useState();
    const isCurrentDocument = route.mode === "document" && route.uuid === currentUuid;
    const title = route.mode === "document"
      ? isCurrentDocument
        ? creating
          ? currentTitle.trim() || "Untitled"
          : null
        : drafts.find((item) => item.uuid === route.uuid)?.title.trim() || "Untitled"
      : null;

    const truncatedTitle =
      title && title.length > 48 ? `${title.slice(0, 48)}…` : title;

    return (
      <>
        {/*<strong><a href="/">@</a></strong>*/}
        <span> / </span>
        <span>Pages</span>
        {title ? (
          <>
            <span> / </span>
            <span title={title}>
              {title.trim() ? `${truncatedTitle}` : "Untitled"}
            </span>
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
