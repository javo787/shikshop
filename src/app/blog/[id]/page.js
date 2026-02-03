import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectMongoDB } from '@/lib/mongodb';
import Blog from '@/models/Blog';
import mongoose from 'mongoose';

export default async function BlogPost({ params }) {
  // 1. Получаем ID/Slug из параметров
  const { id } = await params;
  const t = await getTranslations('blog');

  // 2. Подключаемся к БД напрямую
  try {
    await connectMongoDB();
  } catch (e) {
    console.error('Database connection failed', e);
    // Можно вернуть страницу ошибки или notFound
  }

  let blog = null;

  try {
    // 3. Умный поиск: сначала ищем по Slug (текстовой ссылке)
    // Используем .trim(), чтобы убрать случайные пробелы
    const searchKey = decodeURIComponent(id).trim();
    
    blog = await Blog.findOne({ slug: searchKey });

    // 4. Если по Slug не нашли, проверяем, не ID ли это, и ищем по ID
    if (!blog && mongoose.Types.ObjectId.isValid(searchKey)) {
      blog = await Blog.findById(searchKey);
    }
  } catch (error) {
    console.error('Error querying database:', error);
  }

  // 5. Если блог не найден — показываем 404
  if (!blog) {
    return notFound();
  }

  // Преобразуем Mongoose документ в простой объект (на всякий случай, для сериализации)
  const blogData = JSON.parse(JSON.stringify(blog));

  return (
    <div className="min-h-screen py-16 max-w-4xl mx-auto px-4">
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