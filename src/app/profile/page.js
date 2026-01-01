'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientImage from '@/components/ClientImage';

// Импорт компонентов
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileInfo from '@/components/profile/ProfileInfo';
import CartClient from '@/app/cart/CartClient'; // Корзина внутри профиля

export default function ProfilePage() {
  const [user, setUser] = useState(null); // Firebase User
  const [dbUser, setDbUser] = useState(null); // MongoDB User
  const [orders, setOrders] = useState([]); // <--- ВАЖНО: Стейт для заказов
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); 
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        try {
          // 1. Получаем данные профиля
          const res = await fetch(`/api/users/${currentUser.uid}`);
          if (res.ok) {
            const data = await res.json();
            setDbUser(data);
            
            // 2. ВАЖНО: ЗАГРУЖАЕМ ЗАКАЗЫ ЭТОГО ПОЛЬЗОВАТЕЛЯ
            if (data._id) {
                try {
                    const ordersRes = await fetch(`/api/orders?userId=${data._id}`);
                    if (ordersRes.ok) {
                        const ordersData = await ordersRes.json();
                        setOrders(ordersData); // Сохраняем заказы в стейт
                    }
                } catch (e) {
                    console.error("Ошибка загрузки заказов:", e);
                }
            }
          }
        } catch (err) {
          console.error(err);
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Сохранение данных профиля
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

  // Цвета и названия статусов
  const getStatusLabel = (status) => {
      const statuses = { new: 'Новый', processing: 'В обработке', shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменен' };
      return statuses[status] || status;
  };

  const getStatusColor = (status) => {
      if (status === 'new') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      if (status === 'delivered') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      if (status === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
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
            
            {/* ВКЛАДКА: ПРОФИЛЬ */}
            {activeTab === 'profile' && (
              <ProfileInfo 
                userData={dbUser} 
                onSave={handleSaveProfile} 
              />
            )}

            {/* ВКЛАДКА: КОРЗИНА */}
            {activeTab === 'cart' && (
              <div className="animate-fadeIn">
                 <CartClient />
              </div>
            )}

            {/* ВКЛАДКА: ЗАКАЗЫ (ИСПРАВЛЕНО) */}
            {activeTab === 'orders' && (
               <div className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 animate-fadeIn">
                 <h2 className="text-2xl font-serif font-bold text-dark-teal dark:text-white mb-6">Мои заказы</h2>
                 
                 {/* Проверяем, есть ли заказы в массиве */}
                 {orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="border border-gray-100 dark:border-white/10 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50 dark:bg-white/5">
                                {/* Шапка заказа */}
                                <div className="flex flex-wrap justify-between items-start mb-4 border-b border-gray-200 dark:border-white/10 pb-2 gap-2">
                                    <div>
                                        <p className="font-bold text-dark-teal dark:text-white">
                                            Заказ №{order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : '---')}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                        <p className="font-bold text-accent-rose mt-1">{order.totalAmount} TJS</p>
                                    </div>
                                </div>
                                
                                {/* Список товаров в заказе */}
                                <div className="space-y-2">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-3 items-center">
                                            <div className="relative w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                                <ClientImage 
                                                    src={item.image || '/images/placeholder.jpg'} 
                                                    fill 
                                                    className="object-cover" 
                                                    alt={item.name}
                                                />
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-medium text-dark-teal dark:text-white line-clamp-1">{item.name}</p>
                                                <p className="text-gray-500">
                                                    {item.quantity} шт. {item.size ? `(${item.size})` : ''} — {item.price} TJS
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    // Если заказов нет, показываем заглушку
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🛍️</div>
                        <h3 className="text-lg font-bold text-dark-teal dark:text-white mb-2">История заказов пуста</h3>
                        <p className="text-gray-500 mb-6">Вы еще ничего не заказывали.</p>
                        <Link href="/catalog" className="btn px-6 py-2">Перейти в каталог</Link>
                    </div>
                 )}
               </div>
            )}

            {/* ВКЛАДКА: ИЗБРАННОЕ */}
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