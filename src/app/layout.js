import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Inter, Playfair_Display } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewUserPrompt from '@/components/NewUserPrompt';
import AOSInitializer from '@/components/AOSInitializer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { FavoritesProvider } from '@/context/FavoritesContext'; 
import { CartProvider } from '@/context/CartContext';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
});

// 🔥 SEO НАСТРОЙКИ (Ваша верификация здесь)
export const metadata = {
  title: {
    default: 'PARIZOD | Магазин стильной одежды',
    template: '%s | PARIZOD'
  },
  description: 'Интернет-магазин модной женской одежды в Таджикистане. Платья, пальто, хиджабы и аксессуары с виртуальной примеркой.',
  verification: {
    // 👇 ВОТ ВАШ КОД ПОДТВЕРЖДЕНИЯ
    google: 'QJDsSEZ4Hj4ZwbJvsJzzARfXSf9CeQIDhvOhaKDBUuo',
  },
  openGraph: {
    title: 'PARIZOD',
    description: 'Стильная одежда с доставкой и примеркой.',
    type: 'website',
    locale: 'ru_TJ',
    siteName: 'PARIZOD Shop',
  },
};

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
    <html lang={locale} className={`${inter.variable} ${playfair.variable} dark`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" />
      </head>
      <body className="bg-bg-light dark:bg-dark-teal font-sans flex flex-col min-h-screen">
        {/* Google Analytics */}
        <GoogleAnalytics GA_MEASUREMENT_ID="G-QGF9MP9P5S" />

        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            <FavoritesProvider>
              <Header locale={locale} />
              
              <main className="flex-grow">{children}</main>
              
              <Footer />
              
              <NewUserPrompt />
              
              <AOSInitializer />
            </FavoritesProvider>
          </CartProvider>
        </NextIntlClientProvider>
        
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}