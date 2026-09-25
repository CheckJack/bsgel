import { NextResponse } from "next/server"

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

let opsSinceCleanup = 0
const CLEANUP_EVERY = 200

function cleanupExpired(now: number) {
  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

/**
 * Fixed-window in-memory rate limit (per Node process).
 * Good enough for single-instance PM2; not shared across multiple hosts.
 */
export function rateLimit(opts: {
  /** e.g. "auth:login:ip" */
  key: string
  limit: number
  windowMs: number
}): RateLimitResult {
  const now = Date.now()
  opsSinceCleanup++
  if (opsSinceCleanup >= CLEANUP_EVERY) {
    opsSinceCleanup = 0
    cleanupExpired(now)
  }

  const existing = buckets.get(opts.key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs })
    return {
      ok: true,
      limit: opts.limit,
      remaining: opts.limit - 1,
      retryAfterSeconds: Math.ceil(opts.windowMs / 1000),
    }
  }

  if (existing.count >= opts.limit) {
    return {
      ok: false,
      limit: opts.limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  return {
    ok: true,
    limit: opts.limit,
    remaining: Math.max(0, opts.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  }
}

/** Fail if any of the checks fail (returns the strictest retry). */
export function rateLimitAll(
  checks: Array<{ key: string; limit: number; windowMs: number }>
): RateLimitResult {
  let worst: RateLimitResult | null = null
  for (const check of checks) {
    const result = rateLimit(check)
    if (!result.ok) {
      if (!worst || result.retryAfterSeconds > worst.retryAfterSeconds) {
        worst = result
      }
    }
  }
  if (worst) return worst
  return {
    ok: true,
    limit: checks[0]?.limit ?? 0,
    remaining: checks[0]?.limit ?? 0,
    retryAfterSeconds: 0,
  }
}

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown"
}

export function clientIpFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined> | undefined
): string {
  if (!headers) return "unknown"
  if (headers instanceof Headers) {
    const forwarded = headers.get("x-forwarded-for")
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim()
      if (first) return first
    }
    return headers.get("x-real-ip")?.trim() || "unknown"
  }
  const forwardedRaw = headers["x-forwarded-for"]
  const forwarded = Array.isArray(forwardedRaw) ? forwardedRaw[0] : forwardedRaw
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realRaw = headers["x-real-ip"]
  const real = Array.isArray(realRaw) ? realRaw[0] : realRaw
  return real?.trim() || "unknown"
}

export function tooManyRequestsResponse(
  result: RateLimitResult,
  message = "Too many requests. Please try again later."
) {
  return NextResponse.json(
    {
      error: message,
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  )
}

/** Presets for auth endpoints */
export const AUTH_RATE_LIMITS = {
  loginIp: { limit: 30, windowMs: 15 * 60_000 },
  loginEmail: { limit: 10, windowMs: 15 * 60_000 },
  registerIp: { limit: 8, windowMs: 60 * 60_000 },
  forgotIp: { limit: 10, windowMs: 60 * 60_000 },
  forgotEmail: { limit: 3, windowMs: 60 * 60_000 },
  resendIp: { limit: 10, windowMs: 60 * 60_000 },
  resendEmail: { limit: 3, windowMs: 60 * 60_000 },
  verifyIp: { limit: 30, windowMs: 15 * 60_000 },
  verifyEmail: { limit: 10, windowMs: 15 * 60_000 },
  resetIp: { limit: 15, windowMs: 15 * 60_000 },
} as const
