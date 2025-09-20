'use client';

import Link from 'next/link';
import ClientImage from './ClientImage';

export default function SimpleProductCard({ product, className, ...props }) {
  return (
    <Link href={`/product/${product._id}`} className={`block ${className}`} {...props}>
      <div className="bg-white dark:bg-card-cream rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <ClientImage
          src={product.image || '/images/placeholder.jpg'}
          alt={product.imageAlt || product.name || 'Товар PARIZOD'}
          width={300}
          height={300}
          className="w-full h-48 object-cover"
          loading="eager"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold text-dark-teal dark:text-text-dark">{product.name}</h3>
          {product.price && (
            <p className="text-accent-rose dark:text-primary-pink">
              {product.price} TJS
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}