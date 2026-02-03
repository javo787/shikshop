'use client';

import { useState } from 'react';
import { useFavorites } from '@/context/FavoritesContext';
import Icon from './Icon';

export default function FavoriteButton({ productId, className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const liked = isFavorite(productId);

  const handleClick = (e) => {
    e.preventDefault(); // Блокируем переход по ссылке карточки
    e.stopPropagation();
    
    setIsAnimating(true);
    toggleFavorite(productId);
    
    // Сбрасываем анимацию через 300мс
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative z-20 focus:outline-none transition-transform duration-300 hover:scale-110 ${className}`}
      aria-label={liked ? "Удалить из избранного" : "Добавить в избранное"}
    >
      <Icon 
        name="heart" 
        className={`
          w-6 h-6 transition-all duration-300
          ${liked 
            ? 'fill-red-500 text-red-500 drop-shadow-none' // Если лайкнуто: красное
            : 'fill-transparent text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] stroke-2' // Если нет: прозрачное + белый контур + тень
          }
          ${isAnimating ? 'animate-heart-pop' : ''}
        `}
      />
    </button>
  );
}