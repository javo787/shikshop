'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from './Icon';

export default function NewUserPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли запись в браузере
    const hasVisited = localStorage.getItem('parizod_visited');

    if (!hasVisited) {
      // Если нет, ждем 4 секунды и показываем окно
      const timer = setTimeout(() => {
        setShouldRender(true);
        // Небольшая задержка для анимации появления
        setTimeout(() => setIsVisible(true), 100);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Ждем окончания анимации перед удалением из DOM
    setTimeout(() => {
      setShouldRender(false);
      // Записываем, что пользователь уже видел окно
      localStorage.setItem('parizod_visited', 'true');
    }, 500);
  };

  const handleCtaClick = () => {
    handleClose();
    // Здесь можно добавить аналитику клика
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 max-w-sm w-full transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="bg-white/80 dark:bg-dark-teal/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/20 relative overflow-hidden group">
        
        {/* Декоративный эффект "свечения" */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-pink/20 rounded-full blur-2xl group-hover:bg-primary-pink/30 transition-colors" />

        {/* Кнопка закрытия */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-accent-rose transition-colors p-1"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          <div className="text-3xl mb-3 animate-bounce">✨</div>
          
          <h3 className="text-xl font-serif font-bold text-dark-teal dark:text-white mb-2">
            Впервые у нас?
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
            Добро пожаловать в мир <b>PARIZOD</b>! Ознакомьтесь с нашей новой коллекцией и найдите свой идеальный образ.
          </p>

          <div className="flex gap-3 items-center">
            <Link 
              href="/catalog" 
              onClick={handleCtaClick}
              className="flex-1 bg-gradient-to-r from-accent-rose to-primary-pink text-white py-2.5 px-4 rounded-xl text-center font-bold text-sm shadow-lg hover:shadow-pink-500/30 hover:-translate-y-0.5 transition-all"
            >
              Смотреть каталог
            </Link>
            <button 
              onClick={handleClose}
              className="px-3 text-xs text-gray-500 dark:text-gray-400 hover:underline"
            >
              Позже
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}