'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function ClientImage({ src, alt, ...props }) {
  const [imageSrc, setImageSrc] = useState(src);

  const handleError = () => {
    console.log(`Ошибка загрузки изображения: ${src}`);
    setImageSrc('/images/placeholder.jpg');
  };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
}