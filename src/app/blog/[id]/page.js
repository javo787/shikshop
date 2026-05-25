import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectMongoDB } from '@/lib/mongodb';
import Blog from '@/models/Blog';
import mongoose from 'mongoose';
import Script from 'next/script';

async function getBlogData(id) {
  try {
    await connectMongoDB();
    const searchKey = decodeURIComponent(id).trim();
    let blog = await Blog.findOne({ slug: searchKey });
    if (!blog && mongoose.Types.ObjectId.isValid(searchKey)) {
      blog = await Blog.findById(searchKey);
    }
    return blog;
  } catch (error) {
    console.error('Error fetching blog data:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const blog = await getBlogData(id);

  if (!blog) {
    return {
      title: 'Мақола ёфт нашуд | PARIZOD',
    };
  }

  const imageUrl = blog.image && blog.image.startsWith('http')
    ? blog.image
    : `https://shikshop.vercel.app/api/images/${blog.image}`;

  return {
    title: `${blog.title} | PARIZOD`,
    description: blog.excerpt || blog.content.substring(0, 160),
    openGraph: {
      title: blog.title,
      description: blog.excerpt || blog.content.substring(0, 160),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
      type: 'article',
      publishedTime: blog.createdAt,
      authors: [blog.author || 'PARIZOD'],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt || blog.content.substring(0, 160),
      images: [imageUrl],
    },
  };
}

export default async function BlogPost({ params }) {
  // 1. Получаем ID/Slug из параметров
  const { id } = await params;
  const t = await getTranslations('blog');

  let blog = null;

  try {
    blog = await getBlogData(id);
  } catch (error) {
    console.error('Error in BlogPost:', error);
  }

  // 5. Если блог не найден — показываем 404
  if (!blog) {
    return notFound();
  }

  // Преобразуем Mongoose документ в простой объект (на всякий случай, для сериализации)
  const blogData = JSON.parse(JSON.stringify(blog));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blogData.title,
    image: blogData.image && (blogData.image.startsWith('http') ? blogData.image : `https://shikshop.vercel.app/api/images/${blogData.image}`),
    datePublished: blogData.createdAt,
    dateModified: blogData.updatedAt,
    author: [{
      '@type': 'Person',
      name: blogData.author || 'PARIZOD',
      url: 'https://shikshop.vercel.app',
    }],
    description: blogData.excerpt || blogData.content.substring(0, 160),
  };

  return (
    <div className="min-h-screen py-16 max-w-4xl mx-auto px-4">
      <Script
        id="blog-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/lookbook" className="text-accent-rose hover:underline mb-4 inline-block">
         {/* Можно заменить "/lookbook" на страницу списка блогов, если она другая */}
        ← Вернуться назад
      </Link>
      
      <h1 className="text-4xl font-bold text-dark-teal dark:text-text-light mb-4">
        {blogData.title}
      </h1>
      
      <p className="text-sm text-neutral-gray mb-4">
        {blogData.date || new Date(blogData.createdAt).toLocaleDateString()}
      </p>

      {blogData.image && (
        <Image
          src={blogData.image.startsWith('http') ? blogData.image : `data:image/jpeg;base64,${blogData.image}`}
          alt={blogData.title}
          width={800}
          height={400}
          className="w-full h-auto object-cover rounded-lg mb-6 shadow-md"
          priority
        />
      )}

      <div className="prose dark:prose-invert max-w-none bg-secondary-peach/20 dark:bg-accent-emerald/10 p-6 rounded-lg">
        {/* Если контент хранит HTML, используем dangerouslySetInnerHTML, 
            если просто текст с переносами — style={{ whiteSpace: 'pre-wrap' }} */}
        <div style={{ whiteSpace: 'pre-wrap' }}>
            {blogData.content}
        </div>
      </div>
    </div>
  );
}
