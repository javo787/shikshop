'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function PhoneLogin({ onSuccess, onClose }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('+992');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Инициализация невидимой капчи
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // Капча решена
        },
        'expired-callback': () => setError('Проверка безопасности устарела. Обновите страницу.')
      });
    }
    // Очистка при закрытии
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Удаляем пробелы для проверки длины
    const cleanPhone = phone.replace(/\s/g, '');

    if (cleanPhone.length < 12) {
      setError('Введите корректный номер (например: +992 90 000 0000)');
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
      
      // 👇 ИСПРАВЛЕННАЯ ОБРАБОТКА ОШИБОК (UX)
      if (err.code === 'auth/too-many-requests') {
        setError('Слишком много попыток. Пожалуйста, подождите 5 минут.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Неверный формат номера телефона.');
      } else if (err.code === 'auth/quota-exceeded' || err.code === 'auth/billing-not-enabled' || err.code === 'auth/error-code:-39') {
         // Технические ошибки Google скрываем за понятным сообщением
         setError('Сервис SMS временно перегружен. Пожалуйста, войдите через Telegram или Google.');
      } else {
        // Вместо "Проверьте консоль" пишем вежливую просьбу
        setError('Не удалось отправить код. Проверьте номер и попробуйте еще раз.');
      }

      // Сброс капчи для повторной попытки (важно!)
      if (window.recaptchaVerifier) {
        try {
            // Иногда render() возвращает ID, иногда нет, оборачиваем в try
            window.recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
        } catch(e) {}
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

      // СИНХРОНИЗАЦИЯ С MONGODB
      const syncRes = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          phone: user.phoneNumber
        })
      });

      if (!syncRes.ok) throw new Error('Ошибка синхронизации');

      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error(err);
      setError('Неверный код. Проверьте SMS и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#153030] p-6 rounded-2xl w-full max-w-sm relative shadow-2xl animate-fadeIn border border-gray-100 dark:border-white/10">
      <button 
        onClick={onClose} 
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
      >
        ✕
      </button>

      <h2 className="text-xl font-serif font-bold text-dark-teal dark:text-white mb-6 text-center">
        Вход по номеру
      </h2>

      {error && (
        <div className="bg-red-50 text-red-500 text-xs p-3 rounded-lg mb-4 text-center">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-1">Ваш телефон</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none focus:ring-2 focus:ring-dark-teal transition-all text-lg font-mono dark:text-white"
              placeholder="+992..." 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 bg-dark-teal text-white rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {loading ? 'Отправка...' : 'Получить код'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4 animate-fadeIn">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-1">Код из SMS</label>
            <input 
              type="text" 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              maxLength={6}
              className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none focus:ring-2 focus:ring-primary-pink transition-all text-center text-2xl font-bold tracking-widest dark:text-white"
              placeholder="123456" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 bg-primary-pink text-dark-teal rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {loading ? 'Проверяем...' : 'Войти'}
          </button>
          <button 
            type="button" 
            onClick={() => setStep('phone')} 
            className="w-full text-xs text-center text-gray-400 hover:text-dark-teal mt-2 underline"
          >
            Изменить номер
          </button>
        </form>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
}