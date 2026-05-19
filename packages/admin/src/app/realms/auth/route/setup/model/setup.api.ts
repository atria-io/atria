export const adminSetup = async (): Promise<Response> => {
  return fetch("/admin/setup", { method: "POST" });
};
