import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const PROTECTED_PREFIXES = ["/dashboard", "/cart", "/checkout"] as const

function isProtectedRoute(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  )
}

export default withAuth(
  function middleware(req) {
    if (
      req.nextUrl.pathname.startsWith("/_next") ||
      req.nextUrl.pathname.startsWith("/api") ||
      req.nextUrl.pathname.includes(".")
    ) {
      return NextResponse.next()
    }

    const response = NextResponse.next()
    response.headers.set("x-pathname", req.nextUrl.pathname)

    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname
    const isAdminRoute = pathname.startsWith("/admin")

    if (!token && isProtectedRoute(pathname)) {
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
        if (!isProtectedRoute(pathname)) {
          return true
        }
        if (pathname.startsWith("/admin")) {
          return token?.role === "ADMIN"
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
}
