import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Skip middleware for Next.js internal paths and static assets
    if (req.nextUrl.pathname.startsWith("/_next") || 
        req.nextUrl.pathname.startsWith("/api") ||
        req.nextUrl.pathname.includes(".")) {
      return NextResponse.next()
    }

    const token = req.nextauth.token
    const isAdmin = token?.role === "ADMIN"
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
        if (isAdminRoute) {
          return token?.role === "ADMIN"
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/checkout/:path*", "/cart/:path*"],
}

