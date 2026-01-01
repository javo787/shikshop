'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminLayout({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // 1. Если не залогинен вообще -> на вход
        router.replace('/login');
        return;
      }

      try {
        // 2. Если залогинен -> проверяем права в базе данных
        const res = await fetch(`/api/users/${currentUser.uid}`);
        if (res.ok) {
          const dbUser = await res.json();
          
          if (dbUser.isAdmin) {
            setAuthorized(true); // ✅ Админ, пропускаем
          } else {
            router.replace('/'); // ⛔ Не админ, выгоняем на главную
          }
        } else {
          router.replace('/');
        }
      } catch (error) {
        console.error('Ошибка проверки прав:', error);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f2424]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dark-teal mb-4"></div>
        <p className="text-gray-500 animate-pulse">Проверка прав доступа...</p>
      </div>
    );
  }

  // Если проверка не пройдена, ничего не рендерим (пока идет редирект)
  if (!authorized) return null;

  return (
    <>
      {children}
    </>
  );
}