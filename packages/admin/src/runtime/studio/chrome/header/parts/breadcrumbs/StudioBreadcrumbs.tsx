import type { StudioState } from "@/runtime/studio/StudioTypes.js";

export interface StudioBreadcrumbsProps {
  screen: StudioState;
}

const toCapitalized = (value: string): string =>
  value[0].toUpperCase() + value.slice(1);

export const StudioBreadcrumbs = ({ screen }: StudioBreadcrumbsProps) => {
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
