import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED_PREFIXES = ["/dashboard", "/cart", "/checkout"] as const

function isProtectedRoute(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  )
}

function isMaintenanceAllowlisted(pathname: string) {
  if (pathname === "/coming-soon") return true
  if (pathname === "/login" || pathname.startsWith("/login/")) return true
  if (pathname.startsWith("/api/auth")) return true
  if (pathname === "/api/site-status") return true
  // Admin product media uploads (route still requires ADMIN session)
  if (/^\/api\/products\/[^/]+\/media\/?$/.test(pathname)) return true
  // Keep payment webhooks + cron reachable even during maintenance
  if (pathname.startsWith("/api/payments/webhook")) return true
  if (pathname.startsWith("/api/cron")) return true
  return false
}

async function isMaintenanceEnabled(_req: NextRequest): Promise<boolean> {
  // Env emergency override — always open the site
  if (process.env.MAINTENANCE_FORCE_OFF === "true") return false

  try {
    // Always hit the local Node process — never the public HTTPS origin.
    // Behind Nginx, req.nextUrl.origin is https://biosculpture.pt; fetching that
    // from middleware loops through the proxy and fails → fail-open (site unlocked).
    const port = process.env.PORT || "3000"
    const statusUrl = `http://127.0.0.1:${port}/api/site-status`
    const res = await fetch(statusUrl, {
      headers: { "x-middleware-maintenance-check": "1" },
      cache: "no-store",
    })
    if (!res.ok) return false
    const data = (await res.json()) as { maintenanceMode?: boolean }
    return data.maintenanceMode === true
  } catch {
    // Fail open — never lock the team out because status check failed
    return false
  }
}

export default withAuth(
  async function middleware(req) {
    const pathname = req.nextUrl.pathname

    // Static / Next internals — never gate
    if (pathname.startsWith("/_next") || pathname.includes(".")) {
      return NextResponse.next()
    }

    const token = req.nextauth.token
    const isAdmin = !!token?.id && token?.role === "ADMIN"

    // Maintenance gate (thin layer — before normal auth redirects)
    if (!isAdmin && !isMaintenanceAllowlisted(pathname)) {
      const maintenanceOn = await isMaintenanceEnabled(req)
      if (maintenanceOn) {
        if (pathname.startsWith("/api")) {
          return NextResponse.json(
            { error: "Site is under maintenance" },
            { status: 503 }
          )
        }
        const soon = new URL("/coming-soon", req.url)
        return NextResponse.redirect(soon)
      }
    }

    // Existing behavior: APIs (outside maintenance block above) pass through
    if (pathname.startsWith("/api")) {
      return NextResponse.next()
    }

    const response = NextResponse.next()
    response.headers.set("x-pathname", pathname)

    const isAdminRoute = pathname.startsWith("/admin")

    // token may be {} after ban/deactivate wipe — require a real user id
    if ((!token || !token.id) && isProtectedRoute(pathname)) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return response
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        // Always allow login + coming soon through withAuth's gate
        if (
          pathname === "/coming-soon" ||
          pathname === "/login" ||
          pathname.startsWith("/login/") ||
          pathname.startsWith("/api/auth") ||
          pathname === "/api/site-status"
        ) {
          return true
        }
        if (!isProtectedRoute(pathname)) {
          return true
        }
        if (pathname.startsWith("/admin")) {
          return !!token?.id && token?.role === "ADMIN"
        }
        return !!token?.id
      },
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
}
