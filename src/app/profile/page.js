'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

// Импорт новых компонентов
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileInfo from '@/components/profile/ProfileInfo';
// Пока заглушки, но структура готова:
// import ProfileOrders from '@/components/profile/ProfileOrders';
import Link from 'next/link';
import ClientImage from '@/components/ClientImage';

export default function ProfilePage() {
  const [user, setUser] = useState(null); // Firebase User
  const [dbUser, setDbUser] = useState(null); // MongoDB User
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); 
  const router = useRouter();

  // Читаем имя из куки для быстрого отображения (пока грузится база)
  const cookieName = getCookie('parizod_name');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        // Загружаем данные из нашей базы
        try {
          const res = await fetch(`/api/users/${currentUser.uid}`);
          if (res.ok) {
            const data = await res.json();
            setDbUser(data);
          }
        } catch (err) {
          console.error(err);
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Функция сохранения, которую мы передадим в ProfileInfo
  const handleSaveProfile = async (updatedData) => {
    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        setDbUser(prev => ({ ...prev, ...updatedData }));
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-dark-teal">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-pink"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-dark-teal pb-20 pt-10 px-4">
      <div className="max-w-7xl mx-auto">
        
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-dark-teal dark:text-white mb-8">
          Личный кабинет
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Левая колонка - Навигация */}
          <div className="lg:col-span-1">
            <ProfileSidebar 
              user={dbUser || user} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          </div>

          {/* Правая колонка - Контент */}
          <div className="lg:col-span-3">
            
            {activeTab === 'profile' && (
              <ProfileInfo 
                userData={dbUser} 
                onSave={handleSaveProfile} 
              />
            )}

            {activeTab === 'orders' && (
               <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-white/10 text-center py-20 animate-fadeIn">
                 <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                   <span className="text-4xl">🛍️</span>
                 </div>
                 <h3 className="text-xl font-bold text-dark-teal dark:text-white mb-2">История заказов пуста</h3>
                 <p className="text-gray-500 mb-6">Вы еще ничего не заказывали. Самое время начать шопинг!</p>
                 <Link href="/catalog" className="btn px-8">Перейти в каталог</Link>
               </div>
            )}

            {activeTab === 'favorites' && (
               <div className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 animate-fadeIn">
                   <h2 className="text-2xl font-serif font-bold text-dark-teal dark:text-white mb-6">Избранные товары</h2>
                   {dbUser?.favoritesData?.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                       {dbUser.favoritesData.map(product => (
                         <Link key={product._id} href={`/product/${product._id}`} className="group block bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-pink-200">
                           <div className="relative aspect-[3/4]">
                             <ClientImage src={product.image || '/images/placeholder.jpg'} alt={product.name} fill className="object-cover" />
                           </div>
                           <div className="p-4">
                             <h4 className="font-serif font-bold text-dark-teal dark:text-white truncate group-hover:text-accent-rose transition-colors">{product.name}</h4>
                             <p className="text-accent-rose font-bold mt-1">{product.price} TJS</p>
                           </div>
                         </Link>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-10">
                        <p className="text-gray-500">У вас пока нет избранных товаров.</p>
                     </div>
                   )}
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}