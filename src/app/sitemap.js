import { connectMongoDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Blog from '@/models/Blog';

export default async function sitemap() {
  // 1. Ваш домен
  const baseUrl = 'https://shikshop.vercel.app';

  // 2. Статические страницы (Главная, Каталог, О нас)
  const routes = [
    '',
    '/catalog',
    '/about',
    '/contacts',
    '/lookbook',
    '/cart',
    '/login',
    '/register',
    '/profile',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily', // Главные страницы обновляются часто
    priority: 1,              // Самый высокий приоритет
  }));

  // 3. Динамические товары и блоги
  let dynamicUrls = [];
  
  try {
    await connectMongoDB();
    
    const [products, blogs] = await Promise.all([
      Product.find({}, '_id updatedAt').lean(),
      Blog.find({}, 'slug createdAt updatedAt').lean(),
    ]);

    const productUrls = products.map((product) => ({
      url: `${baseUrl}/product/${product._id}`, 
      lastModified: product.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const blogUrls = blogs.map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: blog.updatedAt || blog.createdAt || new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    dynamicUrls = [...productUrls, ...blogUrls];
    
  } catch (error) {
    console.error('Ошибка генерации sitemap для динамических страниц:', error);
  }

  // 4. Объединяем и отдаем
  return [...routes, ...dynamicUrls];
}