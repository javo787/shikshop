'use client';

import Icon from '@/components/Icon';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import ClientImage from '@/components/ClientImage';

export default function ProfileSidebar({ user, activeTab, setActiveTab }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const menuItems = [
    { id: 'profile', label: 'Мои данные', icon: 'user' },
    { id: 'cart', label: 'Корзина', icon: 'cart' }, // <--- Добавлено
    { id: 'orders', label: 'Мои заказы', icon: 'bag' },
    { id: 'favorites', label: 'Избранное', icon: 'heart' },
  ];

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 h-fit sticky top-24">
      {/* Краткая карточка пользователя */}
      <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-100 dark:border-white/10">
        <div className="relative w-24 h-24 mb-4">
          <ClientImage 
            src={user?.image || user?.photoURL || '/images/placeholder-user.jpg'} 
            alt="Avatar" 
            fill 
            className="rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md"
          />
        </div>
        <h3 className="font-serif font-bold text-xl text-dark-teal dark:text-white text-center">
          {user?.name || 'Пользователь'}
        </h3>
        <p className="text-sm text-gray-400 text-center">{user?.email}</p>
      </div>

      {/* Навигация */}
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-primary-pink text-dark-teal font-bold shadow-md shadow-pink-200 dark:shadow-none' 
                : 'hover:bg-gray-50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Icon 
              name={item.icon} 
              className={`w-5 h-5 transition-colors ${
                activeTab === item.id ? 'text-dark-teal' : 'text-gray-400 group-hover:text-accent-rose'
              }`} 
            />
            <span>{item.label}</span>
          </button>
        ))}

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all mt-4 border-t border-transparent hover:border-red-100"
        >
          <Icon name="logout" className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </nav>
    </div>
  );
}