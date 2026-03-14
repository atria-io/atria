import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  secret: string,
  salt: Buffer,
  keyLength: number
) => Promise<Buffer>;

const HASH_SCHEME = "scrypt";
const SALT_BYTES = 16;
const KEY_BYTES = 64;

const toBuffer = async (secret: string, salt: Buffer): Promise<Buffer> =>
  Buffer.from(await scrypt(secret, salt, KEY_BYTES));

export const hashSecret = async (secret: string): Promise<string> => {
  const salt = randomBytes(SALT_BYTES);
  const derived = await toBuffer(secret, salt);
  return `${HASH_SCHEME}$${salt.toString("hex")}$${derived.toString("hex")}`;
};

export const verifySecret = async (secret: string, storedHash: string): Promise<boolean> => {
  const parts = storedHash.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const [scheme, saltHex, hashHex] = parts;
  if (scheme !== HASH_SCHEME) {
    return false;
  }

  if (!saltHex || !hashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");
  if (salt.length === 0 || expectedHash.length === 0) {
    return false;
  }

  const actualHash = await toBuffer(secret, salt);
  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedHash);
};
