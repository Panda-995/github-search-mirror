import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const SECRET_PREFIX = "enc:v1:";
const IV_BYTES = 12;

function getKey() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required to encrypt stored secrets");
    }
    return createHash("sha256").update("development-secret-do-not-use").digest();
  }

  return createHash("sha256").update(secret).digest();
}

export function isEncryptedSecret(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith(SECRET_PREFIX);
}

export function encryptSecret(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(trimmed, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    SECRET_PREFIX.slice(0, -1),
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) return "";
  if (!isEncryptedSecret(value)) return value;

  const parts = value.split(":");
  if (parts.length !== 5) return "";

  try {
    const [, , ivPart, tagPart, encryptedPart] = parts;
    const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}

export function normalizeSecretForStorage(value: string | null | undefined) {
  if (!value) return null;
  if (isEncryptedSecret(value)) return value;

  const decrypted = decryptSecret(value);
  return decrypted ? encryptSecret(decrypted) : null;
}
