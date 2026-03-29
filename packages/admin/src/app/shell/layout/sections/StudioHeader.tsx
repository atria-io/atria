import type { ReactNode } from "react";

export interface StudioHeaderProps {
  accountPanel: ReactNode;
}

export const StudioHeader = ({ accountPanel }: StudioHeaderProps) => (
  <header className="admin-shell__header">
    <div>Studio</div>
    {accountPanel}
  </header>
);
