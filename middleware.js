import { createMiddleware } from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ru', 'tg'],
  defaultLocale: 'ru',
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};