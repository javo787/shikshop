'use client';

import { useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function TelegramLoginButton({ onSuccess }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Берем имя бота из .env
    const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    
    if (!botName) {
      console.error('Имя бота не указано в NEXT_PUBLIC_TELEGRAM_BOT_USERNAME');
      return;
    }

    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute('data-telegram-login', botName); // Используем имя из env
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.async = true;

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
        alert('Не удалось войти через Telegram');
      }
    };

    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    
    if (wrapperRef.current) {
      wrapperRef.current.innerHTML = '';
      wrapperRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="flex justify-center my-4" ref={wrapperRef}>
      {/* Плейсхолдер пока грузится скрипт */}
      <div className="animate-pulse bg-gray-200 h-10 w-40 rounded-xl"></div>
    </div>
  );
}