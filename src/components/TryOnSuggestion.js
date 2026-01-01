'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';

export default function TryOnSuggestion({ onOpen }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    // Показываем через 5 секунд после входа на страницу
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (isClosed || !isVisible) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 max-w-xs animate-slideUp">
      <div className="bg-white dark:bg-dark-teal border-2 border-primary-pink rounded-2xl p-4 shadow-2xl relative">
        <button 
          onClick={() => setIsClosed(true)}
          className="absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 rounded-full p-1 text-gray-500 hover:text-red-500 transition"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>

        <div className="flex gap-3 items-start">
          <div className="text-3xl animate-bounce-slow">👗</div>
          <div>
            <h4 className="font-bold text-dark-teal dark:text-white text-sm mb-1">
              Не уверены в размере?
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">
              Примерьте это платье на своё фото прямо сейчас! Это бесплатно.
            </p>
            <button 
              onClick={onOpen}
              className="text-xs font-bold text-white bg-gradient-to-r from-accent-rose to-primary-pink px-3 py-1.5 rounded-lg hover:shadow-lg transition-all"
            >
              Попробовать онлайн
            </button>
          </div>
        </div>
        
        {/* Треугольник внизу (хвостик облачка) */}
        <div className="absolute bottom-4 -right-2 w-4 h-4 bg-white dark:bg-dark-teal border-r-2 border-b-2 border-primary-pink transform rotate-[-45deg] translate-x-1"></div>
      </div>
    </div>
  );
}
