'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFavorites } from '@/context/FavoritesContext';
import Icon from './Icon';

export default function FavoriteButton({ productId, className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Локальное состояние для мгновенной реакции (Optimistic UI)
  // Инициализируем сразу правильным значением, чтобы избежать мигания при гидратации
  const [liked, setLiked] = useState(() => isFavorite(productId));
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);

  // Синхронизация с глобальным состоянием (на случай изменений из других мест)
  useEffect(() => {
    setLiked(isFavorite(productId));
  }, [isFavorite, productId]);

  // Очистка таймера при размонтировании (чтобы не было утечек памяти)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Тактильная отдача для мобильных (Haptic Feedback)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // Легкая вибрация 50мс
    }

    // 2. Запуск анимации
    setIsAnimating(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsAnimating(false), 400); // Чуть дольше анимации CSS

    // 3. Оптимистичное переключение (сразу меняем UI)
    const newLikedState = !liked;
    setLiked(newLikedState);

    // 4. Реальный запрос в контекст
    toggleFavorite(productId);
  }, [liked, productId, toggleFavorite]);

  // Стили вынесены для чистоты кода
  const baseClasses = "group relative z-20 p-2 focus:outline-none transition-transform duration-200 ease-out active:scale-90 hover:scale-110";
  const iconBaseClasses = "w-6 h-6 transition-all duration-300 ease-spring"; // ease-spring для пружинистости (если есть в конфиге) или ease-out
  
  const activeIconClasses = "text-red-600 fill-current drop-shadow-none scale-110";
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