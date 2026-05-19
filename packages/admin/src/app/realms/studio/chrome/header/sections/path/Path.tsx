import type { State } from "@/app/realms/studio/model/studio.types.js";

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

  return (
    <>
      <strong><a href="/">@</a></strong>
      <span> / </span>
      {toCapitalized(screen)}
    </>
  );
}

export { Path };
