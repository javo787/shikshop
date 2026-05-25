import LookbookClient from './LookbookClient';

import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  const t = await getTranslations({ locale, namespace: 'header' });

  return {
    title: `${t('lookbook')} | PARIZOD`,
    description: 'Просмотрите галерею модных образов и стилей от PARIZOD. Вдохновение для вашего гардероба.',
    keywords: 'лукбук, образы, стили одежды, PARIZOD, модные луки, женская мода',
    openGraph: {
      title: `${t('lookbook')} | PARIZOD`,
      description: 'Галерея вдохновляющих образов для стильных женщин.',
      images: ['/images/og-image.jpg'],
      url: 'https://shikshop.vercel.app/lookbook',
    },
    robots: 'index, follow',
  };
}

export default function LookbookPage() {
  return <LookbookClient />;
}