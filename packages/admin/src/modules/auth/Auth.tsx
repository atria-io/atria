import type { AuthState } from "./auth.types.js";
import { SetupView } from "./views/SetupView.js";
import { CreateOwnerView } from "./views/CreateOwnerView.js";
import { LoginView } from "./views/LoginView.js";

export interface AuthProps {
  state: AuthState;
}

export const Auth = ({ state }: AuthProps) => {
  switch (state) {
    case "setup":
      return (
        <section className="auth-screen">
          <SetupView />
        </section>
      );
    case "create":
      return (
        <section className="auth-screen">
          <CreateOwnerView />
        </section>
      );
    case "login":
      return (
        <section className="auth-screen">
          <LoginView />
        </section>
      );
  }
};
