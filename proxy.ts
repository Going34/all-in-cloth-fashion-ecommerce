import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/jwt";

const SESSION_COOKIE_NAME = "aic_session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const protectedPaths = ["/account", "/addresses", "/checkout", "/wishlist", "/settings"];
  const adminPaths = ["/admin"];

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let hasValidSession = false;

  if (sessionCookie) {
    try {
      await verifySessionToken(sessionCookie);
      hasValidSession = true;
    } catch {
      hasValidSession = false;
    }
  }

  if (!hasValidSession && protectedPaths.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (
    !hasValidSession &&
    adminPaths.some((path) => pathname.startsWith(path)) &&
    pathname !== "/admin/login"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

