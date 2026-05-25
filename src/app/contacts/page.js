import ContactsClient from './ContactsClient';

import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: `${t('footerContactTitle')} | PARIZOD`,
    description: `${t('footerAddress')}, ${t('footerPhone')}`,
    keywords: 'контакты, PARIZOD, обратная связь, купить одежду, поддержка, адрес магазина, алоқа',
    openGraph: {
      title: `${t('footerContactTitle')} | PARIZOD`,
      description: `${t('footerAddress')}, ${t('footerPhone')}`,
      images: ['/images/og-image.jpg'],
      url: 'https://shikshop.vercel.app/contacts',
    },
    robots: 'index, follow',
  };
}

export default function ContactsPage() {
  return <ContactsClient />;
}