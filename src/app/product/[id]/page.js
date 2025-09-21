import ProductClient from './ProductClient';
import { Suspense } from 'react';

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout 5 сек
      const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${url}`; // Абсолютный URL
      const res = await fetch(fullUrl, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      return res;
    } catch (err) {
      console.error(`Fetch error (attempt ${i + 1}):`, err.message);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  try {
    const res = await fetchWithRetry(`/api/products/${id}`, { next: { revalidate: 3600 } });
    const product = await res.json();
    return {
      title: `${product.name} | PARIZOD - Купить женскую одежду`,
      description: product.description || 'Описание товара PARIZOD: стильная женская одежда, характеристики и отзывы.',
      keywords: `купить ${product.name}, женская одежда, PARIZOD, цена ${product.price}`,
      openGraph: {
        title: `${product.name} | PARIZOD`,
        description: product.description,
        images: [product.image || '/og-image.jpg'],
        url: `https://shikshop.vercel.app/product/${id}`,
      },
      robots: 'index, follow',
      metadataBase: new URL('http://localhost:3000'), // Добавлено для OG
    };
  } catch (err) {
    console.error('Metadata error:', err.message);
    return {
      title: 'Товар не найден | PARIZOD',
      description: 'Ошибка загрузки товара.',
      metadataBase: new URL('http://localhost:3000'),
    };
  }
}

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  let product = null;
  let similarProducts = [];
  let reviews = [];
  let error = null;

  try {
    // Fetch продукта
    const productRes = await fetchWithRetry(`/api/products/${id}`, { next: { revalidate: 3600 } });
    product = await productRes.json();

    // Fetch похожих
    if (product.category || product.type) {
      const similarRes = await fetchWithRetry(
        `/api/products?category=${encodeURIComponent(product.category || '')}&type=${encodeURIComponent(product.type || '')}`,
        { next: { revalidate: 3600 } }
      );
      const similarData = await similarRes.json();
      similarProducts = similarData.filter((p) => p._id !== id).slice(0, 4);
    }

    // Fetch отзывов
    const reviewsRes = await fetchWithRetry(`/api/reviews?productId=${id}`, { next: { revalidate: 3600 } });
    reviews = await reviewsRes.json();
  } catch (err) {
    console.error('Page fetch error:', err.message);
    error = 'Ошибка загрузки товара. Проверьте соединение или ID товара.';
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
      {error ? <div className="text-red-500 text-center">{error}</div> : <ProductClient product={product} similarProducts={similarProducts} reviews={reviews} />}
    </Suspense>
  );
}