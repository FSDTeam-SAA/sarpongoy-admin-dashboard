import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { sessionTokenCookieName } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === "production"
        ? `__Secure-${sessionTokenCookieName}`
        : sessionTokenCookieName,
  });

  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname === "/signin" ||
    pathname === "/forgot-password" ||
    pathname === "/verify-otp" ||
    pathname === "/change-password";

  if (isAuthPage) {
    if (token?.role === "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (token.role !== "admin") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/school-list/:path*",
    "/register-list/:path*",
    "/subscription/:path*",
    "/payment/:path*",
    "/contact-us/:path*",
    "/settings/:path*",
    "/signin",
    "/forgot-password",
    "/verify-otp",
    "/change-password",
  ],
};
