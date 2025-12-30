'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setCookie } from 'cookies-next'; // Импортируем

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Вход через Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Получаем токен
      const token = await user.getIdToken();

      // 3. Сохраняем в COOKIES (живет 30 дней)
      setCookie('parizod_token', token, { maxAge: 60 * 60 * 24 * 30 });
      setCookie('parizod_uid', user.uid, { maxAge: 60 * 60 * 24 * 30 });
      
      // Попробуем достать имя из профиля Firebase и тоже сохранить
      if (user.displayName) {
        setCookie('parizod_name', user.displayName, { maxAge: 60 * 60 * 24 * 30 });
      }

      // 4. Переадресация
      router.push('/profile');
      router.refresh(); // Обновить страницу, чтобы шапка увидела куки
    } catch (err) {
      console.error(err);
      setError('Неверный Email или пароль');
    } finally {
      setLoading(false);
    }
  };

  // ... (Остальной ваш JSX код формы входа без изменений)
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-dark-teal py-20 px-4">
       {/* ... Ваш код формы ... */}
       {/* Не забудьте вставить форму, которую я давал ранее, просто замените функцию handleLogin на эту */}
       <div className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-serif font-bold text-center mb-2 text-dark-teal dark:text-white">Вход</h1>
         {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
         <form onSubmit={handleLogin} className="flex flex-col gap-4">
             {/* Ваши инпуты */}
             <input type="email" placeholder="Email" required className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border focus:outline-none focus:border-primary-pink" onChange={e => setEmail(e.target.value)} />
             <input type="password" placeholder="Пароль" required className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border focus:outline-none focus:border-primary-pink" onChange={e => setPassword(e.target.value)} />
             <button type="submit" disabled={loading} className="btn mt-4 w-full text-lg shadow-lg">{loading ? 'Входим...' : 'Войти'}</button>
         </form>
         <p className="text-center mt-6 text-gray-500 text-sm">Нет аккаунта? <Link href="/register" className="text-accent-rose hover:underline">Зарегистрироваться</Link></p>
       </div>
    </div>
  );
}