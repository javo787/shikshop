'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!confirm('Вы уверены, что хотите заблокировать этого пользователя?')) return;
    
    try {
      const res = await fetch('/api/admin/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, block: true })
      });
      
      if (res.ok) {
        alert('Пользователь заблокирован');
        fetchAnalytics(); // Обновляем данные
      }
    } catch (error) {
      alert('Ошибка блокировки');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-dark-teal">Загрузка аналитики...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f2424] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link href="/admin" className="text-gray-500 hover:text-dark-teal flex items-center gap-2 mb-2 transition-colors">
              <Icon name="arrow-left" className="w-4 h-4" /> Назад в меню
            </Link>
            <h1 className="text-3xl font-serif font-bold text-dark-teal dark:text-white">
              AI Аналитика
            </h1>
          </div>
          <button onClick={fetchAnalytics} className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm hover:shadow-md transition text-dark-teal dark:text-white">
            <Icon name="refresh" className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Карточки статистики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a3d3d] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase mb-2">Всего примерок</h3>
            <p className="text-4xl font-bold text-dark-teal dark:text-white">{data?.stats?.total || 0}</p>
          </div>
          <div className="bg-white dark:bg-[#1a3d3d] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase mb-2">Сегодня</h3>
            <p className="text-4xl font-bold text-primary-pink">{data?.stats?.today || 0}</p>
          </div>
          <div className="bg-white dark:bg-[#1a3d3d] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase mb-2">Нарушителей</h3>
            <p className="text-4xl font-bold text-red-500">
              {data?.topIps?.filter(i => i.count > 5).length || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2. Топ Активных IP (Поиск абузеров) */}
          <div className="bg-white dark:bg-[#1a3d3d] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            <h2 className="text-xl font-bold text-dark-teal dark:text-white mb-6 flex items-center gap-2">
              <span className="text-xl">🕵️‍♂️</span> Подозрительная активность (Топ IP)
            </h2>
            
            <div className="space-y-4">
              {data?.topIps?.map((ipData, idx) => {
                const percentage = Math.min((ipData.count / (data.topIps[0].count || 1)) * 100, 100);
                
                return (
                  <div key={idx} className="relative">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-mono text-gray-600 dark:text-gray-300 font-bold">{ipData._id}</span>
                      <span className="font-bold text-dark-teal dark:text-white">{ipData.count} попыток</span>
                    </div>
                    
                    {/* График-бар */}
                    <div className="h-2 w-full bg-gray-100 dark:bg-black/20 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full ${ipData.count > 10 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    {/* Список юзеров с этого IP */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-gray-400">
                        {ipData.associatedUsers.length > 0 
                          ? `Аккаунты: ${ipData.associatedUsers.length}` 
                          : 'Гость (Без регистрации)'}
                      </div>
                      
                      {/* Кнопка бана (если есть связанные юзеры) */}
                      {ipData.associatedUsers.length > 0 && (
                        <button 
                          onClick={() => handleBlockUser(ipData.associatedUsers[0])}
                          className="text-red-500 hover:text-red-700 font-bold hover:underline"
                        >
                          Заблокировать
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!data?.topIps || data.topIps.length === 0) && <p className="text-gray-400 text-center">Данных пока нет</p>}
            </div>
          </div>

          {/* 3. Лента последних событий */}
          <div className="bg-white dark:bg-[#1a3d3d] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            <h2 className="text-xl font-bold text-dark-teal dark:text-white mb-6">Последние использования</h2>
            <div className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar space-y-3">
              {data?.recentLogs?.map((log) => (
                <div key={log._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {log.status === 'success' ? '✨' : '🚫'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-dark-teal dark:text-white truncate">
                      {log.userId?.name || 'Гость'}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{log.ipAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}