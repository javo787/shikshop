'use client';

import Link from 'next/link';
import ClientImage from './ClientImage';
import FavoriteButton from './FavoriteButton'; // <--- Импорт

export default function SimpleProductCard({ product, className, ...props }) {
  // Адаптируем под "премиум" стиль
  return (
    <div className={`relative group ${className}`} {...props}>
      {/* КНОПКА ЛАЙКА ПОВЕРХ ВСЕГО */}
      <div className="absolute top-3 right-3 z-20">
        <FavoriteButton productId={product._id} />
      </div>

      <Link href={`/product/${product._id}`} className="block h-full">
        <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-transparent hover:border-pink-100 dark:hover:border-pink-900/30 h-full flex flex-col">
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-gray-800">
             <ClientImage
              src={product.image || '/images/placeholder.jpg'}
              alt={product.name || 'Товар'}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
          
          <div className="p-4 text-center mt-auto">
            <h3 className="text-md font-serif font-medium text-dark-teal dark:text-gray-200 line-clamp-1 group-hover:text-accent-rose transition-colors">
              {product.name}
            </h3>
            <p className="text-accent-rose font-bold mt-1 text-lg">
               {product.price ? `${product.price} TJS` : 'Цена по запросу'}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}