'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function ClientImage({ src, alt, fill = false, width = 300, height = 300, className = '', ...props }) {
  const [error, setError] = useState(false);

  const getValidSrc = (imageSrc) => {
    if (!imageSrc || typeof imageSrc !== 'string') {
      console.log('ClientImage: src пустой → placeholder');
      return '/images/placeholder.jpg';
    }

    // Если это уже полный Cloudinary URL — возвращаем как есть
    if (imageSrc.startsWith('https://res.cloudinary.com')) {
      console.log('ClientImage: полный Cloudinary URL →', imageSrc);
      return imageSrc;
    }

    // Если начинается с /api/images/ или /images/ — ок
    if (imageSrc.startsWith('/api/images/') || imageSrc.startsWith('/images/')) {
      return imageSrc;
    }

    // Старый ID → /api/images/ID
    console.log('ClientImage: старый ID → /api/images/' + imageSrc);
    return `/api/images/${imageSrc}`;
  };

  const initialSrc = getValidSrc(src);
  const finalSrc = error ? '/images/placeholder.jpg' : initialSrc;

  const handleError = () => {
    console.log(`ClientImage: Ошибка загрузки ${src} → fallback`);
    setError(true);
  };

  return (
    <Image
      src={finalSrc}
      alt={alt || 'Изображение'}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}