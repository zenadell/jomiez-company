import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/*
 * API keys typed into the admin are stored encrypted (AES-256-GCM), with a key
 * derived from PAYLOAD_SECRET. They are never sent back to the browser and
 * never shown to the model.
 */

const PREFIX = "enc:v1:";

function key() {
  const secret = process.env.PAYLOAD_SECRET || "local-development-secret-change-me";
  return createHash("sha256").update(`${secret}:jomiez-agent-keys`).digest();
}

export const isEncrypted = (value: unknown): boolean => typeof value === "string" && value.startsWith(PREFIX);

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(":");
}

export function decrypt(stored: string | null | undefined): string {
  if (!stored) return "";
  if (!isEncrypted(stored)) return stored ?? "";
  try {
    const [iv, tag, data] = stored.slice(PREFIX.length).split(":").map((p) => Buffer.from(p, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return ""; // PAYLOAD_SECRET changed: the key has to be entered again.
  }
}

/** "••••1a2b": enough to recognise a key without revealing it. */
export const hint = (plain: string) => (plain.length > 8 ? `••••${plain.slice(-4)}` : "••••");
