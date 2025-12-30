'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCookie } from 'cookies-next'; // <--- 1. Добавлен импорт
import Icon from '@/components/Icon';
import ClientImage from '@/components/ClientImage';

export default function ProfilePage() {
  const [user, setUser] = useState(null); // Firebase User
  const [dbUser, setDbUser] = useState(null); // MongoDB User
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'orders', 'favorites'
  const router = useRouter();

  // <--- 2. Читаем имя из куки для мгновенного отображения
  const cookieName = getCookie('parizod_name');

  // Состояния формы
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

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
            setFormData({
              name: data.name || '',
              phone: data.phone || '',
              address: data.address || ''
            });
          }
        } catch (err) {
          console.error(err);
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage('Данные успешно сохранены!');
        // Обновляем локальное состояние, чтобы имя сразу поменялось
        setDbUser(prev => ({ ...prev, ...formData }));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Ошибка при сохранении.');
      }
    } catch (err) {
      setMessage('Ошибка соединения.');
    } finally {
      setIsSaving(false);
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
    <div className="min-h-screen bg-bg-light dark:bg-dark-teal pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Заголовок профиля */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary-pink to-accent-rose flex items-center justify-center text-3xl font-serif text-white shadow-lg">
              {/* Показываем первую букву имени или email */}
              {(dbUser?.name || cookieName || user?.email || '?')[0].toUpperCase()}
            </div>
            <div>
              {/* <--- 3. Обновленная логика отображения имени */}
              <h1 className="text-3xl font-serif font-bold text-dark-teal dark:text-white">
                {dbUser?.name || cookieName || user?.displayName || 'Пользователь'}
              </h1>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-white/5"
          >
            <Icon name="logout" className="w-5 h-5" />
            <span>Выйти</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Навигация (Сайдбар) */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-4 sticky top-24">
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    activeTab === 'profile' 
                      ? 'bg-primary-pink text-dark-teal shadow-md font-bold' 
                      : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Icon name="user" className="w-5 h-5" />
                  Мои данные
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    activeTab === 'orders' 
                      ? 'bg-primary-pink text-dark-teal shadow-md font-bold' 
                      : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Icon name="bag" className="w-5 h-5" />
                  Мои заказы
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    activeTab === 'favorites' 
                      ? 'bg-primary-pink text-dark-teal shadow-md font-bold' 
                      : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Icon name="heart" className="w-5 h-5" />
                  Избранное
                </button>
              </nav>
            </div>
          </div>

          {/* Контент */}
          <div className="lg:col-span-3">
            <div className="glass rounded-2xl p-6 md:p-8 min-h-[400px]">
              
              {/* Вкладка: ПРОФИЛЬ */}
              {activeTab === 'profile' && (
                <div className="animate-fadeIn">
                  <h2 className="text-2xl font-serif font-bold text-dark-teal dark:text-white mb-6">Личная информация</h2>
                  
                  {message && (
                    <div className={`p-4 rounded-xl mb-6 text-center ${message.includes('Ошибка') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleSave} className="space-y-6 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ваше имя</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Телефон</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Адрес доставки</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        rows={3}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors resize-none"
                        placeholder="Город, улица, дом..."
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="btn w-full md:w-auto px-8"
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                  </form>
                </div>
              )}

              {/* Вкладка: ЗАКАЗЫ (Заглушка) */}
              {activeTab === 'orders' && (
                <div className="animate-fadeIn text-center py-10">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="bag" className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-dark-teal dark:text-white mb-2">История заказов пуста</h3>
                  <p className="text-gray-500 mb-6">Вы еще ничего не заказывали. Самое время начать шопинг!</p>
                  <Link href="/catalog" className="btn px-8">Перейти в каталог</Link>
                </div>
              )}

              {/* Вкладка: ИЗБРАННОЕ */}
              {activeTab === 'favorites' && (
                <div className="animate-fadeIn">
                   <h2 className="text-2xl font-serif font-bold text-dark-teal dark:text-white mb-6">Избранные товары</h2>
                   {dbUser?.favoritesData?.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                       {dbUser.favoritesData.map(product => (
                         <Link key={product._id} href={`/product/${product._id}`} className="group block bg-white dark:bg-white/5 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                           <div className="relative aspect-[3/4]">
                             <ClientImage src={product.image || '/images/placeholder.jpg'} alt={product.name} fill className="object-cover" />
                           </div>
                           <div className="p-4">
                             <h4 className="font-serif font-bold text-dark-teal dark:text-white truncate">{product.name}</h4>
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
    </div>
  );
}