// src/components/TryOn/TutorialModal.js
import { useState } from 'react';

export default function TutorialModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col relative animate-scaleIn">
        
        {/* Заголовок */}
        <div className="p-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-center">
            <h3 className="text-2xl font-bold">💡 Секрет идеальной примерки</h3>
            <p className="opacity-90 text-sm mt-1">Посмотрите это короткое видео (30 сек), чтобы получить лучший результат.</p>
        </div>

        {/* Видео Контейнер */}
        <div className="relative aspect-video bg-black">
            {/* ⚠️ ЗАМЕНИТЕ src НА ССЫЛКУ ВАШЕГО ВИДЕО (Youtube Embed или локальный файл) */}
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0" // Пример заглушки
                title="Tutorial" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
            ></iframe>
        </div>

        {/* Советы текстом */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
                <div className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
                    <div className="text-2xl mb-1">💡</div>
                    <span className="font-bold text-gray-700 dark:text-gray-200">Хороший свет</span>
                    <p className="text-xs text-gray-500 mt-1">Лицо и тело должно быть видно четко.</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
                    <div className="text-2xl mb-1">🧍‍♀️</div>
                    <span className="font-bold text-gray-700 dark:text-gray-200">Ровная поза</span>
                    <p className="text-xs text-gray-500 mt-1">Руки чуть в стороны, ноги вместе.</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
                    <div className="text-2xl mb-1">👕</div>
                    <span className="font-bold text-gray-700 dark:text-gray-200">Облегающая одежда</span>
                    <p className="text-xs text-gray-500 mt-1">Лучше всего в майке и легинсах.</p>
                </div>
            </div>
        </div>

        {/* Кнопка */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-center">
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
            >
                Я понял(а), давайте попробуем! 📸
            </button>
        </div>
      </div>
    </div>
  );
}