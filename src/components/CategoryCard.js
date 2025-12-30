'use client';

import Link from 'next/link';
import ClientImage from './ClientImage';

export default function CategoryCard({ name, description, image, className = '' }) {
  return (
    <Link 
      href="/catalog" 
      className={`group block relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 w-full aspect-[4/5] ${className}`}
    >
      {/* Изображение на весь фон */}
      <div className="absolute inset-0">
        <ClientImage
          src={image || '/images/placeholder.jpg'}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Градиентная накладка для читаемости текста */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />
      </div>

      {/* Контент поверх картинки */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-center transform transition-transform duration-300 group-hover:translate-y-[-5px]">
        <h3 className="text-2xl font-serif font-bold text-white mb-2 tracking-wide drop-shadow-md">
          {name}
        </h3>
        
        {/* Описание появляется только при наведении */}
        {description && (
          <p className="text-white/90 text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Декоративная линия, которая удлиняется при наведении */}
        <div className="mt-4 inline-block w-8 h-1 bg-primary-pink rounded-full group-hover:w-16 transition-all duration-300" />
      </div>
    </Link>
  );
}