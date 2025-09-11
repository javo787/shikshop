import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function BlogPost({ params }) {
  const { id } = await params; // Await params to access id
  const t = await getTranslations('blog');

  let blog = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blogs/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Failed to fetch blog');
    blog = await res.json();
  } catch (error) {
    console.error('BlogPost: error fetching API', error);
    return notFound();
  }

  return (
    <div className="min-h-screen py-16 max-w-4xl mx-auto px-4">
      <Link href="/about" className="text-accent-rose hover:underline mb-4 inline-block">
        Вернуться назад
      </Link>
      <h1 className="text-4xl font-bold text-dark-teal dark:text-text-light mb-4">{blog.title}</h1>
      <p className="text-sm text-neutral-gray mb-4">{blog.date}</p>
      {blog.image && (
        <Image
          src={`data:image/jpeg;base64,${blog.image}`}
          alt={blog.title}
          width={800}
          height={400}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
      )}
      <div className="prose dark:prose-invert bg-secondary-peach dark:bg-accent-emerald p-6 rounded-lg">
        <p>{blog.content}</p>
      </div>
    </div>
  );
}