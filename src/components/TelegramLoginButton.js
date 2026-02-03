'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function TelegramLoginButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);

  // Функция запуска входа
  const handleLogin = async () => {
    setLoading(true);
    
    // 1. Генерируем уникальный код (можно просто случайную строку)
    const code = 'tg_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    
    // 2. Сохраняем код в базе (создаем запрос)
    // В данном упрощенном варианте мы просто сразу начинаем поллинг, 
    // но правильнее было бы сначала создать запись через API.
    // Для простоты, API поллинга само скажет "not_found", но нам надо сначала создать запись.
    
    // Создадим запись через API (нужен новый роут или хитрость). 
    // ДАВАЙТЕ ПРОЩЕ: Сгенерируем ссылку сразу на бота. 
    // А запись создастся, когда мы первый раз опросим поллинг? Нет.
    
    // Давайте сделаем шаг инициализации:
    const initRes = await fetch('/api/auth/telegram/init', {
        method: 'POST',
        body: JSON.stringify({ code })
    });
    
    // 3. Открываем Telegram
    const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    const link = `https://t.me/${botName}?start=${code}`;
    window.open(link, '_blank');

    // 4. Начинаем опрашивать сервер (Polling)
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/telegram/poll', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (data.status === 'success') {
           clearInterval(interval);
           await signInWithCustomToken(auth, data.token);
           if (onSuccess) onSuccess();
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000); // Каждые 2 секунды

    // Остановить через 2 минуты
    setTimeout(() => {
        clearInterval(interval);
        setLoading(false);
    }, 120000);
  };

  return (
    <button 
      type="button"
      onClick={handleLogin}
      className="w-full h-full flex items-center justify-center gap-2 bg-[#54a9eb] hover:bg-[#4092d1] text-white transition-colors"
    >
      {loading ? (
        <span className="text-sm">Ожидание...</span>
      ) : (
        <>
           {/* Иконка Telegram самолетик */}
           <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
             <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.629.084 12 12 0 0 0-11.315 11.92L11.944 0zm-1.127 6.463l7.26 2.808c1.77.72 2.697 3.39.297 4.502l-2.074.962-1.026 3.15c-.266.82-1.42 1.025-1.956.347l-1.554-1.968-2.67 1.956c-.722.53-1.745.02-1.78-.88l-.16-5.698 5.16-4.667c.238-.215.01-.587-.278-.445L6.68 9.94l-3.238-1.01c-.886-.277-.92-1.527-.057-1.85l7.432-2.78c.325-.12.69.04.8.363z"/>
           </svg>
           <span className="font-bold">Telegram</span>
        </>
      )}
    </button>
  );
}