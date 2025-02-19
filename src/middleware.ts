import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';

export async function middleware(req: NextRequestWithAuth) {
  const token = await getToken({ req });
  const isAuth = !!token;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL('/profile', req.url));
  }

  if (!isAuthPage && !isAuth) {
    const from = req.nextUrl.pathname;
    return NextResponse.redirect(
      new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  // Handle role-based access
  if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "admin") {
    return NextResponse.redirect(new URL('/profile', req.url));
  }
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*", "/auth/:path*"],
};
