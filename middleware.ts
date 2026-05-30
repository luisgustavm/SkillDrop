import { NextRequest, NextResponse } from "next/server";
import { AUTH_ROUTES, PRIVATE_ROUTES } from "@/lib/constants";

function startsWithAny(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("skilldrop_session")?.value);

  if (startsWithAny(pathname, PRIVATE_ROUTES) && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (startsWithAny(pathname, AUTH_ROUTES) && hasSession) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";

    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/uploads/:path*",
    "/editor/:path*",
    "/chat/:path*",
    "/global-chat/:path*",
    "/shared/:path*",
    "/login",
    "/register",
    "/reset-password",
  ],
};
