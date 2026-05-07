import type { State } from "@/runtime/studio/types.js";

export interface StudioBreadcrumbsProps {
  screen: State;
}

const toCapitalized = (
  value: string
): string =>
  value[0].toUpperCase() + value.slice(1);

export const StudioBreadcrumbs = (
  { screen }: StudioBreadcrumbsProps
) => {
  if (screen === "dashboard") {
    return <strong>@studio</strong>;
  }

  return (
    <>
      <strong><a href="/">@studio</a></strong>
      <span> / </span>
      {toCapitalized(screen)}
    </>
  );
};
