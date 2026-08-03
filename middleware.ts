import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("shopstock_token")?.value;
  const { pathname } = request.nextUrl;

  // পাবলিক রুটসমূহ
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // ১. ইউজার টোকেন না থাকলে এবং প্রাইভেট রুটে ঢুকতে চাইলে -> Login এ পাঠাবে
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ২. ইউজার লগইন থাকা অবস্থায় Login/Register এ ঢুকতে চাইলে -> Dashboard এ পাঠাবে
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// যে পেজগুলোতে Middleware কাজ করবে
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};