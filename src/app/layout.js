import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import { Inter, Playfair_Display } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewUserPrompt from '@/components/NewUserPrompt';
import AOSInitializer from '@/components/AOSInitializer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { FavoritesProvider } from '@/context/FavoritesContext'; 
import { CartProvider } from '@/context/CartContext';
import NextTopLoader from 'nextjs-toploader'; // <--- 1. Импорт загрузчика
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
    url: 'https://shikshop.vercel.app',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PARIZOD - Магазин стильной одежды',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PARIZOD | Магазин стильной одежды',
    description: 'Интернет-магазин модной женской одежды в Таджикистане.',
    images: ['/images/og-image.jpg'],
  },
  metadataBase: new URL('https://shikshop.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'ru-TJ': '/ru',
      'tg-TJ': '/tg',
    },
  },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#ff7f50',
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
      <body className="bg-bg-light dark:bg-dark-teal font-sans flex flex-col min-h-screen">
        {/* Google Analytics */}
        <GoogleAnalytics GA_MEASUREMENT_ID="G-QGF9MP9P5S" />

        {/* 👇 2. Компонент загрузки (Progress Bar) */}
        <NextTopLoader 
          color="#ff7f50"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #ff7f50,0 0 5px #ff7f50"
          zIndex={1600}
        />

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
      </body>
    </html>
  );
}