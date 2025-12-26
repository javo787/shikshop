import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import ClientImage from '@/components/ClientImage'; // Исправлен путь

// Генерация мета-тегов
export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return {
    title: t('metaTitle') || 'Страница не найдена - PARIZOD',
    description: t('metaDescription') || 'К сожалению, страница не найдена. PARIZOD находится в разработке, скоро добавим новые возможности!',
    keywords: t('metaKeywords') || 'PARIZOD, страница не найдена, женская одежда, Душанбе',
    openGraph: {
      title: t('metaTitle') || 'Страница не найдена - PARIZOD',
      description: t('metaDescription') || 'К сожалению, страница не найдена. PARIZOD находится в разработке, скоро добавим новые возможности!',
      url: 'https://shikshop.vercel.app/404',
      siteName: 'PARIZOD',
      images: [
        {
          url: 'https://shikshop.vercel.app/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: t('imageAlt') || 'PARIZOD - Страница не найдена',
        },
      ],
      locale: locale || 'ru_TJ',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle') || 'Страница не найдена - PARIZOD',
      description: t('metaDescription') || 'К сожалению, страница не найдена. PARIZOD находится в разработке, скоро добавим новые возможности!',
      images: ['https://shikshop.vercel.app/images/og-image.jpg'],
    },
  };
}

export default async function NotFound() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-light dark:bg-dark-teal text-dark-teal dark:text-text-light">
      <div className="relative w-full h-64 max-w-4xl mx-auto rounded-lg overflow-hidden mb-8" data-aos="fade-up">
        <ClientImage
          src="/images/404.jpg"
          alt={t('imageAlt') || 'PARIZOD - Страница не найдена'}
          fill
          className="object-cover w-full h-full"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-5xl font-bold text-text-light dark:text-text-dark">{t('title')}</h1>
        </div>
      </div>
      <div className="text-center max-w-2xl px-4" data-aos="fade-up" data-aos-delay="100">
        <h2 className="text-3xl font-semibold mb-4">{t('subtitle')}</h2>
        <p className="text-lg mb-6">{t('description')}</p>
        <Link
          href="/"
          className="bg-accent-rose text-text-light px-6 py-3 rounded-lg hover:bg-primary-pink transition-all inline-block dark:bg-primary-pink dark:hover:bg-accent-rose"
        >
          {t('button')}
        </Link>
      </div>
    </div>
  );
}