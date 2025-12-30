'use client';

import Link from 'next/link';
import ClientImage from './ClientImage';
import Icon from './Icon';
import { useFavorites } from '@/context/FavoritesContext'; // <--- Импорт

export default function ProductCard({ product, onQuickView }) {
  const { isFavorite, toggleFavorite } = useFavorites(); // <--- Хук

  if (!product || !product._id) {
    return <div className="text-red-500 text-center py-4 text-xs">Товар недоступен</div>;
  }

  const displayImage = product.imageLarge || product.image || (product.additionalImages && product.additionalImages[0]) || '/images/placeholder.jpg';
  const liked = isFavorite(product._id); // Проверяем, лайкнут ли

  return (
    <div className="group card-premium relative flex flex-col h-full">
      {/* КНОПКА ЛАЙКА */}
      <button
        onClick={(e) => {
          e.preventDefault(); 
          toggleFavorite(product._id);
        }}
        className={`absolute top-3 right-3 z-20 p-2 rounded-full shadow-md transition-all duration-300 ${
          liked 
            ? 'bg-accent-rose text-white scale-110' 
            : 'bg-white/80 text-gray-400 hover:text-accent-rose hover:bg-white'
        }`}
        aria-label="В избранное"
      >
        <Icon name="heart" className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
      </button>

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

        {/* Кнопка "Быстрый просмотр" */}
        <button
          onClick={(e) => {
            e.preventDefault(); 
            onQuickView();
          }}
          className="absolute z-10
                     bottom-2 right-2 p-2.5 rounded-full bg-white/90 text-dark-teal shadow-md
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