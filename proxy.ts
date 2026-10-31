import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate only.
 *
 * This checks whether a session cookie *exists*, not whether it is valid —
 * verifying the JWT here would drag the auth config (and Prisma) into the
 * proxy bundle. The real check happens in `lib/authz.ts`, on every server
 * component and server action, close to the data.
 *
 * Next.js 16: `middleware.ts` was renamed to `proxy.ts` and runs on Node.js.
 */

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const;

const PUBLIC_PATHS = new Set(["/login"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );

  if (hasSessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);

  // Send them back where they were headed after signing in.
  if (pathname !== "/") {
    loginUrl.searchParams.set("next", pathname);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except the auth endpoints and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
