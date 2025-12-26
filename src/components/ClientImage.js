'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function ClientImage({ src, alt, fill = false, width = 300, height = 300, className = '', ...props }) {
  const [error, setError] = useState(false);

  const getValidSrc = (imageSrc) => {
    if (!imageSrc || typeof imageSrc !== 'string') {
      return '/images/placeholder.jpg';
    }

    // 1. Убираем пробелы (это критично!)
    const cleanSrc = imageSrc.trim();

    // 2. Если это внешняя ссылка (Cloudinary, Google и т.д.) - возвращаем как есть
    if (cleanSrc.startsWith('http')) {
      return cleanSrc;
    }

    // 3. Если это уже путь (начинается со слэша) - возвращаем как есть
    if (cleanSrc.startsWith('/')) {
      return cleanSrc;
    }

    // 4. Если это путь без слэша (например "images/banner.jpg")
    if (cleanSrc.includes('/')) {
      return `/${cleanSrc}`;
    }

    // 5. Иначе считаем, что это старый MongoDB ID
    return `/api/images/${cleanSrc}`;
  };

  const initialSrc = getValidSrc(src);
  // Если была ошибка загрузки, показываем заглушку
  const finalSrc = error ? '/images/placeholder.jpg' : initialSrc;

  return (
    <Image
      src={finalSrc}
      alt={alt || 'Изображение'}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      onError={() => setError(true)}
      // Важно: unoptimized нужен для внешних ссылок, чтобы Next.js не ломался
      unoptimized={finalSrc.startsWith('http')}
      {...props}
    />
  );
}