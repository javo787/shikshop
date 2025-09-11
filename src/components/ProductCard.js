import Image from 'next/image';
import Link from 'next/link';
import Icon from './Icon';

export default function ProductCard({ product, onQuickView }) {
  if (!product || !product._id) {
    return <div className="text-red-500 text-center">Ошибка: товар не найден</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-md">
      <Link href={`/product/${product._id}`}>
        <div className="relative w-full h-64">
          <Image
            src={product.image || '/placeholder.jpg'}
            alt={product.name || 'Товар'}
            fill
            className="object-contain"
          />
        </div>
      </Link>
      <div className="p-4 text-center">
        <h3 className="text-lg font-semibold text-text-dark">{product.name || 'Без названия'}</h3>
        <p className="text-text-gray mb-2">{product.price ? `${product.price} ₽` : 'Цена не указана'}</p>
        <div className="flex justify-center gap-2">
          <button
            onClick={onQuickView}
            className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm sm:text-base hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Быстрый просмотр: ${product.name || 'Товар'}`}
          >
            <Icon name="search" className="w-4 h-4 mr-0.5" />
            Быстрый просмотр
          </button>
          <Link
            href={`/product/${product._id}`}
            className="px-2 py-1 bg-blue-500 text-white rounded text-sm sm:text-base hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Перейти к товару ${product.name || 'Товар'}`}
          >
            Подробнее
          </Link>
        </div>
      </div>
    </div>
  );
}