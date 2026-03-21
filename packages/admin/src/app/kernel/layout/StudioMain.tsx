import React from "react";

interface StudioMainProps {
  children: React.ReactNode;
}

export function StudioMain(props: StudioMainProps): React.JSX.Element {
  const { children } = props;
  return <main className="admin-shell__main">{children}</main>;
}
