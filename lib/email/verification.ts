import { db } from "@/lib/db";
import { generateVerificationCode, hashToken } from "@/lib/email/codes";
import { CODE_TTL_MINUTES } from "@/lib/email/config";

/** Invalidate unused codes and store a new hashed verification code. Returns plaintext code. */
export async function createAndStoreVerificationCode(userId: string): Promise<string> {
  const code = generateVerificationCode();
  const codeHash = hashToken(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await db.emailVerificationCode.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await db.emailVerificationCode.create({
    data: { userId, codeHash, expiresAt },
  });

  return code;
}
