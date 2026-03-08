import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Super Admin: belongs only in /admin — redirect away from dashboard/onboarding
    if (token?.isSuperAdmin) {
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    // Block non-super-admins from /admin routes
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Only OWNER can access billing / settings
    if (
      (pathname.startsWith("/dashboard/settings") ||
        pathname.startsWith("/dashboard/billing")) &&
      token?.role !== "OWNER"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      // Reject tokens marked invalid (user was deleted/recreated) → forces re-login
      authorized: ({ token }) => !!token && !(token as any).invalid,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/admin/:path*"],
};
