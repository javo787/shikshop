'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    // В реальном проекте тут нужен API роут для получения логов. 
    // Я покажу пример роута ниже, а пока заглушка для понимания UI
    /* const res = await fetch('/api/admin/try-on-logs');
    const data = await res.json();
    setLogs(data);
    */
    setLoading(false);
  };

  // UI для аналитики
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-3xl font-bold text-gray-800">Аналитика AI Примерки</h1>
           <Link href="/admin" className="text-blue-500">Назад</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
             <h3 className="text-gray-500 uppercase text-xs font-bold mb-2">Топ пользователей (Multi-account detection)</h3>
             {/* Тут будет таблица IP с кол-вом попыток */}
             <div className="text-center text-gray-400 py-10">Данные загружаются... (Нужен API роут)</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
             <h3 className="text-gray-500 uppercase text-xs font-bold mb-2">Последние использования</h3>
             {/* Список последних логов */}
          </div>
        </div>
      </div>
    </div>
  );
}