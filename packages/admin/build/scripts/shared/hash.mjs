import { md5 } from "../../../../shared/dist/hash/md5.js";

export const hashDirectoryName = (name) => md5(name).slice(0, 3);
export const hashFileName = (content, extension) => `${md5(content).slice(0, 8)}${extension}`;
export const isAlreadyHashedJsFile = (name) => /^[a-f0-9]{8}\.js$/i.test(name);
