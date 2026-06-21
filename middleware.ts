import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!token || token.role !== "ADMIN") {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Affiliate dashboard routes ─────────────────────────────────────────────
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/affiliate")) {
    if (!token) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    if (token.role === "AFFILIATE" && token.status !== "APPROVED") {
      return NextResponse.redirect(new URL("/awaiting-approval", request.url))
    }
    return NextResponse.next()
  }

  // ── Awaiting approval page ─────────────────────────────────────────────────
  if (pathname === "/awaiting-approval") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (token.role === "ADMIN" || token.status === "APPROVED") {
      const dest = token.role === "ADMIN" ? "/admin" : "/dashboard"
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // ── Auth pages: redirect if already logged in ──────────────────────────────
  if (pathname === "/login" || pathname === "/signup") {
    if (token) {
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
      if (token.status === "APPROVED") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      return NextResponse.redirect(new URL("/awaiting-approval", request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/awaiting-approval",
    "/login",
    "/signup",
    "/api/admin/:path*",
    "/api/affiliate/:path*",
  ],
}
