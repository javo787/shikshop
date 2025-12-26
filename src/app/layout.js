import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import Header from '@/components/Header'; // Убрали лишний /src/
import AOSInitializer from '@/components/AOSInitializer'; // Убрали лишний /src/
import '@/styles/globals.css'; // Убрали лишний /src/

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  
  let messages;
  try {
    // Импорт сообщений оставляем относительным, так как папка messages лежит в корне (вне src)
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error('RootLayout: error loading messages for locale', locale, error);
    messages = (await import(`../../messages/ru.json`)).default;
  }

  return (
    <html lang={locale} className={`${inter.className} dark`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" />
      </head>
      <body className="bg-bg-light dark:bg-dark-teal">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header locale={locale} />
          <main className="min-h-screen">{children}</main>
          <AOSInitializer />
        </NextIntlClientProvider>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}