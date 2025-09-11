import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function About() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('my_shikshop_locale')?.value || 'ru';
  const t = await getTranslations('about');

  let blogs = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blogs`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Failed to fetch blogs');
    blogs = await res.json();
  } catch (error) {
    console.error('About: error fetching blogs API', error);
    blogs = [
      { id: 1, title: t('blogs.item1.title'), content: t('blogs.item1.content'), image: null, date: '2023-01-01' },
      { id: 2, title: t('blogs.item2.title'), content: t('blogs.item2.content'), image: null, date: '2023-02-01' },
    ];
  }

  return (
    <div className="min-h-screen py-16">
      <section className="text-center mb-12" data-aos="fade-up">
        <h1 className="text-4xl font-bold text-dark-teal dark:text-text-light mb-4">{t('greetingTitle')}</h1>
        <p className="text-lg max-w-3xl mx-auto">{t('greetingDescription')}</p>
      </section>

      <section className="mb-12" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-dark-teal dark:text-text-light mb-6 text-center">{t('aboutStoreTitle')}</h2>
        <div className="max-w-4xl mx-auto">
          <p className="mb-4">{t('aboutStoreDescription')}</p>
        </div>
      </section>

      <section className="mb-12" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-dark-teal dark:text-text-light mb-6 text-center">{t('advantagesTitle')}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <li className="p-4 bg-secondary-peach rounded-lg dark:bg-accent-emerald">
            <h3 className="text-xl font-bold mb-2">{t('advantages.item1.title')}</h3>
            <p>{t('advantages.item1.description')}</p>
          </li>
          <li className="p-4 bg-secondary-peach rounded-lg dark:bg-accent-emerald">
            <h3 className="text-xl font-bold mb-2">{t('advantages.item2.title')}</h3>
            <p>{t('advantages.item2.description')}</p>
          </li>
          <li className="p-4 bg-secondary-peach rounded-lg dark:bg-accent-emerald">
            <h3 className="text-xl font-bold mb-2">{t('advantages.item3.title')}</h3>
            <p>{t('advantages.item3.description')}</p>
          </li>
          <li className="p-4 bg-secondary-peach rounded-lg dark:bg-accent-emerald">
            <h3 className="text-xl font-bold mb-2">{t('advantages.item4.title')}</h3>
            <p>{t('advantages.item4.description')}</p>
          </li>
        </ul>
      </section>

      <section className="mb-12" data-aos="fade-up">
        <h2 className="text-3xl font-semibold text-dark-teal dark:text-text-light mb-6 text-center">{t('blogsTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
          {blogs.map((blog) => (
            <Link key={blog._id || blog.id} href={`/blog/${blog._id || blog.id}`} className="block">
              <div className="bg-white dark:bg-card-cream rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {blog.image && (
                  <img
                    src={`data:image/jpeg;base64,${blog.image}`}
                    alt={blog.title}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2">{blog.title}</h3>
                  <p className="text-sm text-neutral-gray mb-2">{blog.date}</p>
                  <p className="text-base">{blog.content.substring(0, 100)}...</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {blogs.length === 0 && <p className="text-center">{t('noBlogs')}</p>}
      </section>
    </div>
  );
}