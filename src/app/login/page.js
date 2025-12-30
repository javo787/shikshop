'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      await signInWithEmailAndPassword(auth, email, password);
      // Успешный вход
      router.push('/profile'); 
    } catch (err) {
      console.error(err);
      setError('Неверный Email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-dark-teal py-20 px-4">
      <div className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-serif font-bold text-center mb-2 text-dark-teal dark:text-white">Вход</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">С возвращением в PARIZOD</p>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center border border-red-100">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="email" placeholder="Email" required 
            className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors text-dark-teal dark:text-white"
            onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Пароль" required 
            className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors text-dark-teal dark:text-white"
            onChange={e => setPassword(e.target.value)}
          />
          
          <button type="submit" disabled={loading} className="btn mt-4 w-full text-lg shadow-lg">
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Нет аккаунта? <Link href="/register" className="text-accent-rose hover:underline font-medium">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}