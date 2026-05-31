const DEFAULT_FRONTEND_URL = "http://localhost:3333";

export const frontendUrl = async () => {
  return process.env.ATRIA_FRONTEND_URL?.trim() || DEFAULT_FRONTEND_URL;
};
