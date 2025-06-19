export { default } from 'next-auth/middleware';

export const config = {
  // защищаем все роуты, начинающиеся с /admin
  matcher: ['/admin/:path*'],
};