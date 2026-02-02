'use client';

import { useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function TelegramLoginButton({ onSuccess }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    // ЛОГ 1: Проверяем старт компонента
    console.log('🔵 [TelegramDebug] Компонент монтируется...');

    const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    
    // ЛОГ 2: Проверяем имя бота
    console.log('🔵 [TelegramDebug] Имя бота из env:', botName);
    
    if (!botName) {
      console.error('🔴 [TelegramDebug] ОШИБКА: Не задано имя бота!');
      return;
    }

    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.async = true;

    // Функция, которую вызывает Telegram ПОСЛЕ успешного ввода пароля
    window.onTelegramAuth = async (user) => {
      // ЛОГ 3: Telegram вернул данные
      console.log('🔵 [TelegramDebug] Telegram вернул пользователя:', user);
      
      try {
        console.log('🔵 [TelegramDebug] Отправляем данные на сервер /api/auth/telegram...');
        
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });

        // ЛОГ 4: Ответ сервера
        console.log('🔵 [TelegramDebug] Статус ответа сервера:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Ошибка сервера: ${res.status} ${errorText}`);
        }
        
        const data = await res.json();
        console.log('🔵 [TelegramDebug] Токен получен, входим в Firebase...');

        await signInWithCustomToken(auth, data.token);
        console.log('🟢 [TelegramDebug] УСПЕХ! Вход выполнен.');
        
        if (onSuccess) onSuccess();
        
      } catch (error) {
        console.error('🔴 [TelegramDebug] ОШИБКА входа:', error);
        alert(`Ошибка входа: ${error.message}`);
      }
    };

    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    
    if (wrapperRef.current) {
      wrapperRef.current.innerHTML = '';
      wrapperRef.current.appendChild(script);
      console.log('🔵 [TelegramDebug] Скрипт виджета добавлен в DOM');
    }
  }, [onSuccess]);

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-hidden" 
      ref={wrapperRef}
    >
      <div className="animate-pulse bg-blue-50 h-10 w-32 rounded-full"></div>
    </div>
  );
}