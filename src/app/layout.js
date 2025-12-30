import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Inter, Playfair_Display } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer'; // <--- Импорт нового компонента Footer
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
  variable: '--font-playfair',
  display: 'swap',
});

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  
  let messages;
  try {
    // Импорт сообщений (путь относительный к src/app)
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error('RootLayout: error loading messages for locale', locale, error);
    messages = (await import(`../../messages/ru.json`)).default;
  }

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable} dark`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" />
      </head>
      {/* Добавили flex flex-col min-h-screen, чтобы футер прижимался к низу */}
      <body className="bg-bg-light dark:bg-dark-teal font-sans flex flex-col min-h-screen">
        <GoogleAnalytics GA_MEASUREMENT_ID="G-QGF9MP9P5S" />

        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header locale={locale} />
          
          {/* flex-grow заставляет контент занимать все свободное место */}
          <main className="flex-grow">{children}</main>
          
          {/* Вставляем глобальный футер */}
          <Footer />
          
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