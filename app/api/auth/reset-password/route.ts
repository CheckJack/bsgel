import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/email/codes";
import {
  AUTH_RATE_LIMITS,
  clientIpFromRequest,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(16),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const ip = clientIpFromRequest(req);
    const limited = rateLimit({
      key: `auth:reset:ip:${ip}`,
      ...AUTH_RATE_LIMITS.resetIp,
    });
    if (!limited.ok) {
      return tooManyRequestsResponse(limited);
    }

    const body = await req.json();
    const { token, password } = schema.parse(body);
    const tokenHash = hashToken(token);

    const record = await db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      db.passwordResetToken.updateMany({
        where: { userId: record.userId, consumedAt: null },
        data: { consumedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("reset-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
