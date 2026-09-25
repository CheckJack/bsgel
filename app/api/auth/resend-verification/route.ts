import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmailVerificationCode } from "@/lib/email/auth-emails";
import { createAndStoreVerificationCode } from "@/lib/email/verification";
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
      { key: `auth:resend:ip:${ip}`, ...AUTH_RATE_LIMITS.resendIp },
      { key: `auth:resend:email:${normalizedEmail}`, ...AUTH_RATE_LIMITS.resendEmail },
    ]);
    if (!limited.ok) {
      return tooManyRequestsResponse(
        limited,
        "Please wait before requesting another code"
      );
    }

    // Always return success shape to avoid email enumeration
    const ok = () =>
      NextResponse.json({
        success: true,
        message: "If an account exists and needs verification, a new code has been sent.",
      });

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        emailVerifiedAt: true,
        certificationId: true,
        certificateUrl: true,
        certification: { select: { name: true } },
      },
    });

    if (!user || user.emailVerifiedAt) {
      return ok();
    }

    const code = await createAndStoreVerificationCode(user.id);
    const pendingCertification =
      !!user.certificationId &&
      !!user.certificateUrl &&
      user.certificateUrl.trim() !== "";

    await sendEmailVerificationCode({
      to: normalizedEmail,
      name: user.name,
      code,
      pendingCertification,
      certificationName: user.certification?.name || null,
    });

    return ok();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("resend-verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
