import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyTokenHash } from "@/lib/email/codes";
import {
  AUTH_RATE_LIMITS,
  clientIpFromRequest,
  rateLimitAll,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = schema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    const ip = clientIpFromRequest(req);

    const limited = rateLimitAll([
      { key: `auth:verify:ip:${ip}`, ...AUTH_RATE_LIMITS.verifyIp },
      { key: `auth:verify:email:${normalizedEmail}`, ...AUTH_RATE_LIMITS.verifyEmail },
    ]);
    if (!limited.ok) {
      return tooManyRequestsResponse(limited);
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerifiedAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const candidates = await db.emailVerificationCode.findMany({
      where: {
        userId: user.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const match = candidates.find((c) => verifyTokenHash(trimmedCode, c.codeHash));
    if (!match) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    await db.$transaction([
      db.emailVerificationCode.update({
        where: { id: match.id },
        data: { consumedAt: new Date() },
      }),
      db.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
      db.emailVerificationCode.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("verify-email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
