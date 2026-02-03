'use client';

import { useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function TelegramLoginButton({ onSuccess }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    
    if (!botName) {
      console.warn('Telegram Bot: Имя бота не найдено в .env');
      return;
    }

    // Создаем скрипт вручную, как в документации
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large'); // Размер кнопки (large = 40px высота)
    script.setAttribute('data-radius', '12');  // Закругление углов (как у ваших инпутов)
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false'); // Убираем аватарку, чтобы было компактно
    script.async = true;

    // Callback функция (вызывается ТОЛЬКО если домен разрешен в BotFather)
    window.onTelegramAuth = async (user) => {
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });

        if (!res.ok) throw new Error('Ошибка сервера');
        
        const { token } = await res.json();
        await signInWithCustomToken(auth, token);
        
        if (onSuccess) onSuccess();
        
      } catch (error) {
        console.error('Ошибка входа через Telegram:', error);
      }
    };

    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    
    if (wrapperRef.current) {
      wrapperRef.current.innerHTML = '';
      wrapperRef.current.appendChild(script);
    }
  }, [onSuccess]);

  return (
    // Этот контейнер центрирует кнопку
    <div ref={wrapperRef} className="flex items-center justify-center w-full h-full">
      {/* Заглушка, пока кнопка грузится */}
      <div className="animate-pulse bg-blue-50 h-[40px] w-[200px] rounded-xl"></div>
    </div>
  );
}