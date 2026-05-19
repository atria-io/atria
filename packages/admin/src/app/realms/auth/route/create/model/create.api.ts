import type { CreateOwnerValues } from "./create.types.js";

export const createAccount = async (
  values: CreateOwnerValues
): Promise<Response> => {
  return fetch("/auth/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values),
  });
};
