import path from "node:path";

export const isInsideDirectory = (basePath: string, targetPath: string): boolean => {
  const relativePath = path.relative(basePath, targetPath);
  return relativePath !== "" && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
};
