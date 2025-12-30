import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import ClientImage from '@/components/ClientImage'; // Исправлен путь
import PromoBanner from '@/components/PromoBanner'; // Исправлен путь
import SimpleProductCard from '@/components/SimpleProductCard'; // Исправлен путь
import CategoryCard from '@/components/CategoryCard'; // Исправлен путь
import TipCard from '@/components/TipCard'; // Исправлен путь
import Icon from '@/components/Icon'; // Исправлен путь
import { cookies } from 'next/headers';

// Заставляем страницу рендериться динамически
export const dynamic = 'force-dynamic';

// Генерация мета-тегов
export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('metaTitle') || 'PARIZOD - Женская одежда в Таджикистане',
    description: t('metaDescription') || 'Модная женская одежда в Таджикистане. Платья, костюмы, аксессуары и многое другое. Бесплатная доставка по городу!',
    keywords: t('metaKeywords') || 'женская одежда, мода, Душанбе, платья, костюмы, аксессуары, курта, либос, харидан, мода2025, новости, Худжанд, Таджикистан, паризод, паризода, паризодшоп, parizod, PARIZOD',
    openGraph: {
      title: t('metaTitle') || 'PARIZOD - Женская одежда',
      description: t('metaDescription') || 'Ознакомьтесь с нашей коллекцией стильной женской одежды в Таджикистане.',
      url: 'https://shikshop.vercel.app/',
      siteName: 'PARIZOD',
      images: [
        {
          url: 'https://shikshop.vercel.app/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: t('bannerAlt') || 'PARIZOD - Модная женская одежда',
        },
      ],
      locale: locale || 'ru_TJ',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle') || 'PARIZOD - Женская одежда',
      description: t('metaDescription') || 'Модная женская одежда в Таджикистане.',
      images: ['https://shikshop.vercel.app/images/og-image.jpg'],
    },
  };
}

export default async function Home() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  console.log('Home: locale =', locale);

  const t = await getTranslations({ locale, namespace: 'home' });

  // Загрузка данных о продуктах и категориях
  let apiData = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`, {
      cache: 'force-cache', // Кэширование на 1 час
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    apiData = await res.json();
  } catch (error) {
    console.error('Home: error fetching products API', error.message);
    apiData = [];
  }

  const categories = apiData
    .filter(item => item.type === 'collection' || item.type === 'look')
    .map((item, id) => ({
      id,
      name: item.name || item.title || t('noName') || 'Без названия',
      description: item.description || '',
      image: item.image || '/images/placeholder.jpg',
      imageAlt: item.name ? `${item.name} - ${t('categoryAlt')}` : t('categoryAlt') || 'Категория одежды PARIZOD',
    }))
    .slice(0, 6); 
  const products = apiData
    .filter(item => !item.type || (item.type !== 'collection' && item.type !== 'look'))
    .map((item, id) => ({
      _id: item._id || id.toString(),
      name: item.name || item.title || t('noName') || 'Без названия',
      price: item.price || null,
      image: item.image || '/images/placeholder.jpg',
      imageAlt: item.name ? `${item.name} - ${t('productAlt')}` : t('productAlt') || 'Товар PARIZOD',
    }))
    .slice(0, 6); // Ограничиваем до 6 товаров

  // Загрузка данных о советах
  let tips = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/blogs`, {
      cache: 'force-cache', // Кэширование на 1 час
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Failed to fetch blogs');
    tips = await res.json();
  } catch (error) {
    console.error('Home: error fetching blogs API', error.message);
    tips = [];
  }

  const socialPosts = [
    { id: 1, image: '/images/instagram1.jpg', alt: t('socialAlt') || 'PARIZOD в Instagram - Пост 1' },
    { id: 2, image: '/images/instagram2.jpg', alt: t('socialAlt') || 'PARIZOD в Instagram - Пост 2' },
    { id: 3, image: '/images/instagram3.jpg', alt: t('socialAlt') || 'PARIZOD в Instagram - Пост 3' },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative h-110 sm:h-[80vh] overflow-hidden" data-aos="fade-up">
        <ClientImage
          src="/images/banner.jpg"
          alt={t('bannerAlt') || 'PARIZOD - Главный баннер модной женской одежды'}
          fill
          className="object-cover w-full h-full z-0"
          priority
          loading="eager"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-text-light dark:text-text-dark z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4">{t('bannerTitle')}</h1>
          <p className="text-base sm:text-lg md:text-2xl mb-6 max-w-2xl">{t('bannerDescription')}</p>
          <Link href="/catalog" className="btn">
            {t('bannerButton')}
          </Link>
          <p className="mt-4 text-sm">{t('freeShipping')}</p>
        </div>
      </section>

      <section className="py-10" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-dark-teal text-center mb-8 dark:text-text-light">{t('categoriesTitle')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <div
                key={category.id}
                className="flex flex-col items-center gap-4"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <CategoryCard
                  name={category.name}
                  description={category.description}
                  image={category.image}
                  imageAlt={category.imageAlt}
                  className="w-full"
                />
              </div>
            ))
          ) : (
            <p className="text-center col-span-full">{t('errorCategories') || 'Ошибка загрузки категорий. Попробуйте позже.'}</p>
          )}
        </div>
        <div className="text-center mt-8">
          <Link href="/catalog" className="bg-accent-rose text-text-light px-6 py-3 rounded-lg hover:bg-primary-pink transition-all inline-block">
            {t('viewAllRest')}
          </Link>
        </div>
      </section>

      <section className="py-16 bg-secondary-peach dark:bg-accent-emerald relative" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-dark-teal text-center mb-8 dark:text-text-light">{t('productsTitle')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-7xl mx-auto px-4">
          {products.length > 0 ? (
            products.map((product, index) => (
              <SimpleProductCard
                key={product._id}
                product={{
                  ...product,
                  imageAlt: product.imageAlt,
                }}
                className={index % 2 === 1 ? 'mt-4 sm:mt-0' : ''}
                data-aos="fade-up"
                data-aos-delay={index * 100}
              />
            ))
          ) : (
            <p className="text-center col-span-full">{t('errorProducts') || 'Ошибка загрузки товаров. Попробуйте позже.'}</p>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-bg-light/0 to-bg-light dark:from-dark-teal/0 dark:to-dark-teal" />
        <div className="text-center mt-8">
          <Link
            href="/catalog"
            className="bg-primary-pink text-text-light px-6 py-3 rounded-lg hover:bg-[#F0D9D0] transition-all inline-block dark:bg-accent-rose dark:hover:bg-primary-pink"
            data-aos="fade-up"
          >
            {t('viewAll')}
          </Link>
        </div>
      </section>

      <section className="py-5" data-aos="fade-up">
        <div className="relative h-64 max-w-7xl mx-auto rounded-lg overflow-hidden">
          <ClientImage
            src="/images/brand.jpg"
            alt={t('brandAlt') || 'PARIZOD - О бренде'}
            width={1920}
            height={1080}
            className="object-cover z-0"
            priority
            loading="eager"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-text-light dark:text-text-dark z-0">
            <h2 className="text-3xl font-semibold mb-4">{t('brandTitle')}</h2>
            <p className="text-lg mb-6 max-w-xl">{t('brandDescription')}</p>
            <Link
              href="/about"
              className="bg-primary-pink text-dark-teal px-6 py-3 rounded-lg hover:bg-accent-rose transition-transform transform hover:scale-105 dark:bg-secondary-lavender dark:text-text-light"
            >
              {t('brandButton')}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-soft-rose dark:bg-secondary-lavender" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-dark-teal text-center mb-8 dark:text-text-light">{t('tipsTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-7xl mx-auto px-4">
          {tips.length > 0 ? (
            tips.slice(0, 3).map((tip, index) => (
              <Link key={tip._id || tip.id} href="/about" data-aos="fade-up">
                <TipCard
                  title={tip.title}
                  description={tip.description}
                  icon={index % 2 === 0 ? '/images/tip1.svg' : '/images/tip2.svg'}
                  className="flex flex-row items-center hover:shadow-lg transition-shadow"
                />
              </Link>
            ))
          ) : (
            <p className="text-center col-span-full">{t('errorTips') || 'Ошибка загрузки советов. Попробуйте позже.'}</p>
          )}
        </div>
      </section>

      <section className="py-5" data-aos="fade-up">
        <PromoBanner
          title={t('promoTitle')}
          description={t('promoDescription')}
          buttonText={t('promoButton')}
          buttonLink="/catalog"
          className="bg-linear-to-r from-primary-pink to-secondary-lavender text-text-light dark:text-text-dark"
          buttonClassName="bg-promo-accent hover:bg-primary-pink text-text-light dark:bg-secondary-lavender dark:hover:bg-accent-rose dark:text-text-light"
        />
      </section>

      <section className="py-16" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-dark-teal text-center mb-8 dark:text-text-light">{t('socialTitle')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-7xl mx-auto px-4">
          {socialPosts.map((post) => (
            <div key={post.id} className="relative h-48 rounded-lg overflow-hidden transition-transform transform hover:scale-105" data-aos="fade-up">
              <ClientImage
                src={post.image}
                alt={post.alt}
                width={300}
                height={300}
                className="object-cover"
                loading="eager"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
        <p className="text-center mt-8">
          <Link href="https://www.instagram.com/parizod_tj/" target="_blank" className="text-accent-emerald hover:underline dark:text-text-light">
            {t('socialButton')}
          </Link>
        </p>
      </section>
    </div>
  );
}