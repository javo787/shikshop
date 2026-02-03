'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFavorites } from '@/context/FavoritesContext';
import Icon from './Icon';

export default function FavoriteButton({ productId, className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [liked, setLiked] = useState(() => isFavorite(productId));
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setLiked(isFavorite(productId));
  }, [isFavorite, productId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    setIsAnimating(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsAnimating(false), 400);

    setLiked((prev) => !prev);
    toggleFavorite(productId);
  }, [productId, toggleFavorite]);

  const baseClasses = "group relative z-20 p-2 focus:outline-none transition-transform duration-200 ease-out active:scale-90 hover:scale-110";
  const iconBaseClasses = "w-6 h-6 transition-all duration-300";
  
  // ИЗМЕНЕНИЕ ЗДЕСЬ: добавил stroke-none для активного состояния, чтобы убрать контур при заливке
  const activeIconClasses = "text-red-600 fill-current stroke-none drop-shadow-none scale-110";
  // ИЗМЕНЕНИЕ ЗДЕСЬ: явно указал stroke-[2px] для неактивного
  const inactiveIconClasses = "text-white fill-transparent stroke-[2px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]";

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${className}`}
      aria-label={liked ? "Удалить из избранного" : "Добавить в избранное"}
      aria-pressed={liked}
    >
      <Icon 
        name="heart" 
        className={`
          ${iconBaseClasses}
          ${liked ? activeIconClasses : inactiveIconClasses}
          ${isAnimating ? 'animate-heart-pop' : ''}
        `}
      />
    </button>
  );
}