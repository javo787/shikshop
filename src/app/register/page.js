'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Создаем аккаунт в Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Обновляем имя в профиле Firebase (техническое)
      await updateProfile(user, { displayName: formData.name });

      // 3. Сохраняем данные в MongoDB (наш API)
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: formData.name,
          phone: formData.phone // Сохраняем телефон для связи
        }),
      });

      if (!res.ok) throw new Error('Ошибка сохранения данных');

      // 4. Успех! Идем в профиль
      router.push('/profile'); 
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Этот Email уже зарегистрирован');
      } else if (err.code === 'auth/weak-password') {
        setError('Пароль должен быть не менее 6 символов');
      } else {
        setError('Ошибка регистрации. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-dark-teal py-20 px-4">
      <div className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-serif font-bold text-center mb-2 text-dark-teal dark:text-white">Регистрация</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Создайте аккаунт в PARIZOD</p>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" placeholder="Ваше имя" required 
            className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors text-dark-teal dark:text-white"
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
          <input 
            type="email" placeholder="Email" required 
            className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors text-dark-teal dark:text-white"
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="tel" placeholder="Телефон (для связи)" 
            className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors text-dark-teal dark:text-white"
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
          <input 
            type="password" placeholder="Пароль (минимум 6 символов)" required minLength={6}
            className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors text-dark-teal dark:text-white"
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          
          <button type="submit" disabled={loading} className="btn mt-4 w-full text-lg shadow-lg">
            {loading ? 'Создаем...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Уже есть аккаунт? <Link href="/login" className="text-accent-rose hover:underline font-medium">Войти</Link>
        </p>
      </div>
    </div>
  );
}