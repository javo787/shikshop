'use client';

import Link from 'next/link';
import ClientImage from './ClientImage';
import Icon from './Icon';
import FavoriteButton from './FavoriteButton';

export default function ProductCard({ product, onQuickView }) {
  if (!product || !product._id) {
    return <div className="text-red-500 text-center py-4 text-xs">Товар недоступен</div>;
  }

  const displayImage = product.imageLarge || product.image || (product.additionalImages && product.additionalImages[0]) || '/images/placeholder.jpg';

  return (
    <div className="group card-premium relative flex flex-col h-full">
      {/* Кнопка лайка (верхний правый угол) */}
      <div className="absolute top-3 right-3 z-20">
        <FavoriteButton productId={product._id} />
      </div>

      <Link
        href={`/product/${product._id}`}
        className="block relative w-full aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-gray-800/50"
      >
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
          <ClientImage
            src={displayImage}
            alt={product.imageAlt || product.name || 'Товар PARIZOD'}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>

        {/* --- НОВАЯ КНОПКА ПОИСКА (Нижний правый угол) --- */}
        <button
          onClick={(e) => {
            e.preventDefault(); 
            onQuickView();
          }}
          // Стили разделены на мобильные и десктопные (md:)
          className="absolute z-10 transition-all duration-300
                     /* Мобильный стиль: Прозрачный, в углу, белый текст */
                     bottom-2 right-2 p-2 text-white hover:scale-110 active:scale-95
                     /* Десктоп стиль (md:): По центру, с фоном, появляется при наведении */
                     md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:translate-y-4
                     md:px-5 md:py-2.5 md:rounded-full md:bg-white/90 md:text-dark-teal md:shadow-md
                     md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0
                     md:hover:bg-accent-rose md:hover:text-white md:hover:scale-105"
          aria-label="Быстрый просмотр"
        >
          <div className="flex items-center gap-2">
            {/* Иконка: на мобильном с тенью и толстым контуром, на десктопе обычная */}
            <Icon 
              name="search" 
              className="w-6 h-6 stroke-[2px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] 
                         md:w-4 md:h-4 md:stroke-[1.5px] md:drop-shadow-none" 
            />
            <span className="hidden md:inline text-sm font-medium">Быстрый просмотр</span>
          </div>
        </button>
      </Link>

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