import NextAuth from "next-auth"
import type { NextRequest } from "next/server"
import { authOptions } from "@/lib/auth"
import {
  AUTH_RATE_LIMITS,
  clientIpFromRequest,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rate-limit"

const handler = NextAuth(authOptions)

export async function GET(
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  return handler(req, context)
}

export async function POST(
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  if (req.nextUrl.pathname.includes("/callback/credentials")) {
    const ip = clientIpFromRequest(req)
    const limited = rateLimit({
      key: `auth:login:ip:${ip}`,
      ...AUTH_RATE_LIMITS.loginIp,
    })
    if (!limited.ok) {
      return tooManyRequestsResponse(
        limited,
        "Too many login attempts. Please try again later."
      )
    }
  }

  return handler(req, context)
}
