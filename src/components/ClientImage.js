'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function ClientImage({ src, alt, fill = false, width = 300, height = 300, className = '', ...props }) {
  const [error, setError] = useState(false);

  const getValidSrc = (imageSrc) => {
    if (!imageSrc || typeof imageSrc !== 'string') {
      return '/images/placeholder.jpg';
    }

    let cleanSrc = imageSrc.trim();

    // 🚑 ЭКСТРЕННАЯ ПОМОЩЬ: Удаляем двойной префикс, если он есть
    // Если ссылка выглядит как "/api/images/https://...", мы убираем начало
    if (cleanSrc.includes('/api/images/http')) {
      cleanSrc = cleanSrc.replace('/api/images/', '');
    }

    // Теперь, если это http - возвращаем
    if (cleanSrc.startsWith('http')) {
      return cleanSrc;
    }

    // Если это локальный путь (/images/...)
    if (cleanSrc.startsWith('/images/')) {
      return cleanSrc;
    }

    // Если это уже правильный API путь (но не двойной)
    if (cleanSrc.startsWith('/api/images/')) {
      return cleanSrc;
    }

    // Если это просто ID (нет слэшей), добавляем префикс
    return `/api/images/${cleanSrc}`;
  };

  const initialSrc = getValidSrc(src);
  const finalSrc = error ? '/images/placeholder.jpg' : initialSrc;

  // Разрешаем оптимизацию для доверенных доменов
  const isTrustedExternal =
    finalSrc.includes('res.cloudinary.com') ||
    finalSrc.includes('replicate.delivery') ||
    finalSrc.includes('replicate.com');

  return (
    <Image
      src={finalSrc}
      alt={alt || 'Изображение'}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      onError={() => setError(true)}
      unoptimized={finalSrc.startsWith('http') && !isTrustedExternal}
      sizes={props.sizes || (fill ? '100vw' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')}
      {...props}
    />
  );
}