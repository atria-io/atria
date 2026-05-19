import type { SignInValues } from "./signin.types.js";

export const signIn = async (values: SignInValues): Promise<Response> => {
  return fetch("/auth/sign-in", {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(values),
  });
};
