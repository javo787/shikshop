'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from './Icon'; //

export default function NewUserPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Проверяем LocalStorage (он сохраняется даже после закрытия браузера)
    const hasVisited = localStorage.getItem('parizod_visited');
    
    if (!hasVisited) {
      // Задержка 3 секунды перед показом
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShowPrompt(false);
    // Записываем, что пользователь уже видел окно (или просто был на сайте)
    localStorage.setItem('parizod_visited', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 max-w-sm w-full animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-primary-pink relative">
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <span className="text-4xl mb-2 block">🎁</span>
          <h3 className="text-xl font-bold text-dark-teal dark:text-white mb-2">
            Впервые у нас?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            Зарегистрируйтесь сейчас и получите доступ к закрытым распродажам и истории заказов!
          </p>
          <div className="flex gap-2 justify-center">
            <Link 
              href="/register" 
              onClick={handleClose}
              className="bg-accent-rose text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-pink transition"
            >
              Регистрация
            </Link>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:underline text-sm px-2"
            >
              Позже
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}