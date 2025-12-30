import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Inter, Playfair_Display } from 'next/font/google'; // 1. Импорт Playfair_Display
import Header from '@/components/Header';
import AOSInitializer from '@/components/AOSInitializer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import '@/styles/globals.css';

// Основной шрифт (для текста)
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// Акцентный шрифт (для заголовков)
const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair', // 2. Создаем CSS переменную
  display: 'swap',
});

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error('RootLayout: error loading messages for locale', locale, error);
    messages = (await import(`../../messages/ru.json`)).default;
  }

  return (
    // 3. Добавляем оба шрифта в className
    <html lang={locale} className={`${inter.variable} ${playfair.variable} dark`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" />
      </head>
      <body className="bg-bg-light dark:bg-dark-teal font-sans">
        <GoogleAnalytics GA_MEASUREMENT_ID="G-QGF9MP9P5S" />

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