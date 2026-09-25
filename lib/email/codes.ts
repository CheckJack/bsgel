import { createHash, randomBytes, randomInt } from "crypto";

/** Generate a 6-digit numeric verification code. */
export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

/** Generate a URL-safe password reset token. */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/** SHA-256 hash for codes/tokens (fast, sufficient for short-lived secrets). */
export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyTokenHash(value: string, hash: string): boolean {
  const computed = hashToken(value);
  if (computed.length !== hash.length) return false;
  // Constant-time compare
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return mismatch === 0;
}
