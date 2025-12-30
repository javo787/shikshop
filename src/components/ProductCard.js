'use client';

import Link from 'next/link';
import ClientImage from './ClientImage';
import Icon from './Icon';

export default function ProductCard({ product, onQuickView }) {
  if (!product || !product._id) {
    return <div className="text-red-500 text-center py-4 text-xs">Товар недоступен</div>;
  }

  const displayImage = product.imageLarge || product.image || (product.additionalImages && product.additionalImages[0]) || '/images/placeholder.jpg';

  return (
    <div className="group card-premium relative flex flex-col h-full">
      {/* Ссылка на товар (покрывает фото) */}
      <Link
        href={`/product/${product._id}`}
        className="block relative w-full aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-gray-800/50"
      >
        {/* Изображение с эффектом плавного увеличения при наведении */}
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
          <ClientImage
            src={displayImage}
            alt={product.imageAlt || product.name || 'Товар PARIZOD'}
            fill
            className="object-cover" // Используем cover, чтобы фото заполняло карточку без пустот
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>

        {/* Кнопка "Быстрый просмотр" */}
        <button
          onClick={(e) => {
            e.preventDefault(); // Чтобы клик не открывал страницу товара
            onQuickView();
          }}
          className="absolute z-10
                     /* Мобильные стили: круглая кнопка в углу, всегда видна */
                     bottom-2 right-2 p-2.5 rounded-full bg-white/90 text-dark-teal shadow-md
                     
                     /* Десктопные стили: кнопка по центру с текстом, всплывает при наведении */
                     md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:translate-y-4
                     md:px-5 md:py-2.5 md:rounded-full
                     md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0
                     
                     transition-all duration-300
                     hover:bg-accent-rose hover:text-white"
          aria-label="Быстрый просмотр"
        >
          <div className="flex items-center gap-2">
            <Icon name="search" className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline text-sm font-medium">Быстрый просмотр</span>
          </div>
        </button>
      </Link>

      {/* Информация о товаре */}
      <div className="p-3 md:p-4 flex flex-col flex-grow text-center">
        <Link href={`/product/${product._id}`} className="block group-hover:text-accent-rose transition-colors">
          <h3 className="text-sm md:text-lg font-serif font-medium text-text-dark dark:text-text-light line-clamp-1 mb-1">
            {product.name || 'Без названия'}
          </h3>
        </Link>

        <div className="mt-auto">
          <p className="text-accent-rose font-bold text-base md:text-lg">
            {product.price ? `${product.price} TJS` : 'Цена по запросу'}
          </p>
        </div>
      </div>
    </div>
  );
}