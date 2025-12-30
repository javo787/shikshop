'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Admin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (err) {
      setError('Ошибка входа: проверьте email или пароль');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/admin');
  };

  if (user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-text-dark mb-6">Админ-панель</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <Link href="/admin/javo" className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center group">
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">👗</span>
            <span className="font-bold text-dark-teal">Товары</span>
          </Link>

          {/* НОВАЯ КНОПКА КЛИЕНТЫ */}
          <Link href="/admin/users" className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center group">
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">👥</span>
            <span className="font-bold text-dark-teal">Клиенты</span>
          </Link>

          <Link href="/admin/messages" className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center group">
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">✉️</span>
            <span className="font-bold text-dark-teal">Сообщения</span>
          </Link>

          <Link href="/admin/reviews" className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center group">
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">⭐</span>
            <span className="font-bold text-dark-teal">Отзывы</span>
          </Link>

          <Link href="/admin/blogs" className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center group">
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📝</span>
            <span className="font-bold text-dark-teal">Блог</span>
          </Link>

          <button onClick={handleSignOut} className="bg-red-50 border border-red-100 p-6 rounded-xl shadow-sm hover:bg-red-100 transition-all flex flex-col items-center justify-center text-center text-red-600">
            <span className="text-4xl mb-2">🚪</span>
            <span className="font-bold">Выйти</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-dark-teal">Вход для администратора</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-pink"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-pink"
            required
          />
          <button type="submit" className="bg-dark-teal text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all">
            Войти
          </button>
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}