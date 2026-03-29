import { useEffect, useRef, type ReactNode } from "react";

export interface AuthShellProps {
  route: "setup" | "create" | "login";
  children: ReactNode;
}

export const AuthShell = ({ route, children }: AuthShellProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const resolved = (window as Window & { __atria__?: { scheme?: { resolved?: string } } })
      .__atria__?.scheme?.resolved;

    if (resolved === "light" || resolved === "dark") {
      rootRef.current?.setAttribute("data-scheme", resolved);
    }
  }, []);

  return (
    <div ref={rootRef} className="admin-shell" data-route={route} data-scheme="light">
      <main className="admin-shell__main">
        <section className="auth-screen">{children}</section>
      </main>
    </div>
  );
};
