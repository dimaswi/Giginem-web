import { NextResponse, type NextRequest } from "next/server";

// Next.js 16: must be named 'proxy' or default export
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (but not /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    // Check for Supabase auth token in cookies
    const hasSession =
      request.cookies.getAll().some(
        (c) =>
          c.name.startsWith("sb-") && c.name.endsWith("-auth-token") && c.value !== ""
      );

    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
