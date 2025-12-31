'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';

export default function AuthRequestModal({ isOpen, onClose }) {
  // Блокируем скролл страницы когда окно открыто
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#1a3d3d] rounded-2xl shadow-2xl max-w-md w-full p-8 relative transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <Icon name="close" className="w-5 h-5 text-gray-500" />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce-slow">
            💖
          </div>
          
          <h3 className="text-2xl font-serif font-bold text-dark-teal dark:text-white mb-3">
            Давайте познакомимся?
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Чтобы добавить эту красоту в свой гардероб или список желаний, нам нужно узнать вас поближе. 
            <br/><span className="text-sm opacity-80 mt-2 block">Это займет всего минуту!</span>
          </p>

          <div className="flex flex-col gap-3">
            <Link 
              href="/register" 
              className="btn w-full py-3 text-lg shadow-lg hover:shadow-pink-500/30"
            >
              Создать аккаунт
            </Link>
            <Link 
              href="/login" 
              className="w-full py-3 rounded-xl border-2 border-dark-teal text-dark-teal font-bold hover:bg-dark-teal hover:text-white transition-all dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-dark-teal"
            >
              Войти
            </Link>
          </div>
          
          <button 
            onClick={onClose}
            className="mt-6 text-sm text-gray-400 hover:text-dark-teal dark:hover:text-white transition-colors underline"
          >
            Я просто смотрю
          </button>
        </div>
      </div>
    </div>
  );
}