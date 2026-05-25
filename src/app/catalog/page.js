import CatalogClient from './CatalogClient';

import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  const t = await getTranslations({ locale, namespace: 'catalog' });

  return {
    title: `${t('title')} | PARIZOD`,
    description: t('productsTitle'),
    keywords: 'женская одежда, каталог товаров, коллекции, аксессуары, PARIZOD, купить одежду онлайн, либоси занона, каталоги маҳсулот',
    openGraph: {
      title: `${t('title')} | PARIZOD`,
      description: t('productsTitle'),
      images: ['/images/og-image.jpg'],
      url: 'https://shikshop.vercel.app/catalog',
    },
    robots: 'index, follow',
  };
}

export default function CatalogPage() {
  return <CatalogClient />;
}