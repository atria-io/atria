import { useSignInState } from "./model/signin.state.js";
import { SignInUI } from "./ui/Signin.js";

function Signin() {
  const model = useSignInState();
  return <SignInUI {...model} />;
}

export { Signin };
