import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin')) {
    if (!token || token.role !== 'ADMIN') {
      const url = new URL(`/`, req.url);
      url.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/auth')) {
    if (token) {
      const url = new URL('/', req.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/auth/:path*'
  ],
};