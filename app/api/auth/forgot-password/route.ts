import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateResetToken, hashToken } from "@/lib/email/codes";
import { RESET_TTL_HOURS, SITE_URL } from "@/lib/email/config";
import { sendPasswordResetEmail } from "@/lib/email/auth-emails";
import {
  AUTH_RATE_LIMITS,
  clientIpFromRequest,
  rateLimitAll,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();
    const ip = clientIpFromRequest(req);

    const limited = rateLimitAll([
      { key: `auth:forgot:ip:${ip}`, ...AUTH_RATE_LIMITS.forgotIp },
      { key: `auth:forgot:email:${normalizedEmail}`, ...AUTH_RATE_LIMITS.forgotEmail },
    ]);
    if (!limited.ok) {
      return tooManyRequestsResponse(limited);
    }

    const generic = NextResponse.json({
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return generic;
    }

    const banned = await db.bannedEmail.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (banned) {
      return generic;
    }

    const token = generateResetToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000);

    await db.passwordResetToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${SITE_URL}/login?mode=reset&token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: user.name,
      resetUrl,
    });

    return generic;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("forgot-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
