'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import Icon from './Icon'; // Используем ваш компонент иконок, если есть, или удалите

export default function PhoneLogin({ onSuccess, onClose }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('+992');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  // Инициализация reCAPTCHA (Invisible)
  useEffect(() => {
    // Проверка, чтобы не инициализировать дважды
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // Капча решена автоматически
        },
        'expired-callback': () => {
          setError('Срок действия капчи истек. Обновите страницу.');
        }
      });
    }
    
    // Очистка при размонтировании не нужна для window объекта, но можно сбросить
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (phone.length < 12) {
      setError('Введите полный номер (например: +992 90 000 0000)');
      setLoading(false);
      return;
    }

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (err) {
      console.error('Ошибка SMS:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Слишком много попыток. Попробуйте позже или используйте тестовый номер.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Неверный формат номера.');
      } else {
        setError('Ошибка отправки SMS. Проверьте консоль.');
      }
      // Сброс капчи для повторной попытки
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await confirmationResult.confirm(otp);
      const user = res.user;

      // СИНХРОНИЗАЦИЯ С ВАШЕЙ БАЗОЙ (MongoDB)
      const syncRes = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          phone: user.phoneNumber
        })
      });

      if (syncRes.ok) {
        if (onSuccess) onSuccess(); // Закрываем модалку или обновляем данные
      } else {
        setError('Ошибка создания профиля');
      }

    } catch (err) {
      console.error(err);
      setError('Неверный код подтверждения.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#153030] p-6 rounded-2xl w-full max-w-md mx-auto relative shadow-2xl animate-fadeIn">
      {/* Кнопка закрытия */}
      {onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
        >
          ✕
        </button>
      )}

      <h2 className="text-2xl font-serif font-bold text-dark-teal dark:text-white mb-6 text-center">
        Вход / Регистрация
      </h2>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4 text-center border border-red-100">
          {error}
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+992 90 123 4567"
              className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 focus:border-dark-teal focus:ring-1 focus:ring-dark-teal outline-none transition-all text-lg font-mono dark:text-white"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              Мы отправим SMS с кодом подтверждения
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-dark-teal text-white rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {loading ? 'Отправка...' : 'Получить код'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Код из SMS</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 focus:border-primary-pink focus:ring-1 focus:ring-primary-pink outline-none transition-all text-center text-3xl font-bold tracking-widest dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-pink text-dark-teal rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {loading ? 'Проверяем...' : 'Войти'}
          </button>
          <button
            type="button"
            onClick={() => setStep('phone')}
            className="w-full text-sm text-gray-400 hover:text-dark-teal dark:hover:text-white transition-colors"
          >
            ← Изменить номер
          </button>
        </form>
      )}

      {/* Контейнер для капчи (скрыт, но должен быть в DOM) */}
      <div id="recaptcha-container"></div>
    </div>
  );
}