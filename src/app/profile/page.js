'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null); // Данные из MongoDB
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        // Загружаем доп. данные
        const res = await fetch(`/api/users/${currentUser.uid}`);
        if (res.ok) setDbUser(await res.json());
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) return <div className="p-10 text-center">Загрузка...</div>;

  return (
    <div className="container mx-auto p-4 py-10">
      <div className="bg-white dark:bg-card-cream p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-pink rounded-full flex items-center justify-center text-2xl font-bold text-white">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-teal">Мой профиль</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Личные данные</h2>
          {/* Форма редактирования данных (имя, телефон) */}
          <div className="grid gap-4">
             <p><strong>Телефон:</strong> {dbUser?.phone || 'Не указан'}</p>
             <p><strong>Адрес доставки:</strong> {dbUser?.address || 'Не указан'}</p>
          </div>
        </div>

        <button 
          onClick={() => signOut(auth)} 
          className="mt-8 text-red-500 hover:text-red-700 font-medium"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}