export const isRootPublicPath = (requestPath: string): boolean => {
  const normalizedPath = requestPath.replace(/\/+$/, "");
  return normalizedPath.length === 0 || normalizedPath === "/index.html";
};
