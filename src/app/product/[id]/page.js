import ProductClient from './ProductClient';
import { Suspense } from 'react';

// Вспомогательная функция для повторных запросов (если сеть моргнула)
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      // Используем полный URL для серверных запросов
      const fullUrl = url.startsWith('http') 
        ? url 
        : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${url}`;
        
      const res = await fetch(fullUrl, options);
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      return res;
    } catch (err) {
      console.error(`Fetch error (attempt ${i + 1}):`, err.message);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 1. ГЕНЕРАЦИЯ МЕТА-ТЕГОВ (SEO и ссылки для соцсетей)
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    const res = await fetchWithRetry(`/api/products/${id}`, { next: { revalidate: 3600 } });
    const product = await res.json();

    // 👇 ИСПРАВЛЕНИЕ: Проверяем, является ли ссылка внешней
    const imageUrl = product.image && product.image.startsWith('http')
      ? product.image
      : `/api/images/${product.image}`;

    return {
      title: `${product.name} | PARIZOD`,
      description: product.description ? product.description.slice(0, 160) : 'Модная женская одежда',
      openGraph: {
        title: product.name,
        description: product.description ? product.description.slice(0, 160) : 'Купить в PARIZOD',
        images: [
          {
            url: imageUrl, // Теперь ссылка будет правильной
            width: 800,
            height: 600,
            alt: product.name,
          },
        ],
      },
    };
  } catch (error) {
    console.error('Metadata error:', error);
    return {
      title: 'Товар не найден | PARIZOD',
      description: 'К сожалению, этот товар недоступен.',
    };
  }
}

// 2. ОСНОВНАЯ СТРАНИЦА
export default async function Page({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  let product = null;
  let similarProducts = [];
  let reviews = [];
  let error = null;

  try {
    // Загрузка товара
    const productRes = await fetchWithRetry(`/api/products/${id}`, { cache: 'no-store' });
    product = await productRes.json();

    // Загрузка похожих товаров
    if (product) {
      try {
        const category = product.category ? encodeURIComponent(product.category) : '';
        const type = product.type ? encodeURIComponent(product.type) : '';
        const similarRes = await fetchWithRetry(
          `/api/products?category=${category}&type=${type}`, 
          { next: { revalidate: 3600 } }
        );
        const similarData = await similarRes.json();
        // Убираем текущий товар из похожих
        similarProducts = similarData.filter((p) => p._id !== id).slice(0, 4);
      } catch (e) {
        console.error('Error fetching similar products:', e);
      }

      // Загрузка отзывов
      try {
        const reviewsRes = await fetchWithRetry(`/api/reviews?productId=${id}`, { cache: 'no-store' });
        reviews = await reviewsRes.json();
      } catch (e) {
        console.error('Error fetching reviews:', e);
      }
    }
  } catch (err) {
    console.error('Page loading error:', err);
    error = 'Не удалось загрузить информацию о товаре.';
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error || 'Товар не найден'}
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
      <ProductClient 
        product={product} 
        similarProducts={similarProducts} 
        reviews={reviews} 
      />
    </Suspense>
  );
}