'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import ClientImage from '@/components/ClientImage';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all'); // Фильтр: all, new, processing...

  // Загрузка заказов при старте
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  // Изменение статуса заказа
  const handleStatusChange = async (orderId, newStatus) => {
    // 1. Оптимистичное обновление (сразу меняем в интерфейсе)
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    
    // Если открыто модальное окно с этим заказом, обновляем и его
    if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
    
    // 2. Отправляем запрос на сервер
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
    } catch (error) {
      console.error('Ошибка обновления статуса');
      fetchOrders(); // Если ошибка - загружаем реальные данные обратно
    }
  };

  // Цвета для разных статусов
  const getStatusColor = (status) => {
    const map = {
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      processing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      shipped: 'bg-purple-100 text-purple-700 border-purple-200',
      delivered: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  // Логика фильтрации
  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-dark-teal">Загрузка заказов...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f2424] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Шапка и Фильтры */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                <Link href="/admin" className="text-gray-500 hover:text-dark-teal text-sm mb-2 inline-flex items-center gap-1 transition-colors">
                    <Icon name="arrow-left" className="w-3 h-3"/> Назад в меню
                </Link>
                <h1 className="text-3xl font-serif font-bold text-dark-teal dark:text-white">Управление заказами</h1>
            </div>
            
            {/* Кнопки фильтров */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {['all', 'new', 'processing', 'delivered', 'cancelled'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all whitespace-nowrap border ${
                    filter === f 
                      ? 'bg-dark-teal text-white border-dark-teal shadow-md' 
                      : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-white/20'
                  }`}
                >
                  {f === 'all' ? 'Все' : (f === 'new' ? 'Новые' : f)}
                </button>
              ))}
            </div>
        </div>

        {/* Таблица заказов */}
        <div className="bg-white dark:bg-[#1a3d3d] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                <tr>
                  <th className="p-4">Заказ</th>
                  <th className="p-4">Клиент</th>
                  <th className="p-4">Сумма</th>
                  <th className="p-4">Статус</th>
                  <th className="p-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-mono text-sm font-bold text-dark-teal dark:text-white">
                        {order.orderNumber || '---'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800 dark:text-gray-200">{order.shippingAddress?.name || 'Гость'}</div>
                      <div className="text-xs text-gray-500">{order.shippingAddress?.phone}</div>
                    </td>
                    <td className="p-4 font-bold text-accent-rose">
                      {order.totalAmount} TJS
                    </td>
                    <td className="p-4">
                      <select 
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border appearance-none cursor-pointer outline-none focus:ring-2 ring-primary-pink transition-all ${getStatusColor(order.status)}`}
                      >
                        <option value="new">Новый</option>
                        <option value="processing">В обработке</option>
                        <option value="shipped">Отправлен</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменен</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-sm font-bold text-gray-400 hover:text-dark-teal dark:hover:text-white transition-colors"
                      >
                        Подробнее &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Если список пуст */}
            {filteredOrders.length === 0 && (
                <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400">
                    <Icon name="bag" className="w-10 h-10 mb-2 opacity-20" />
                    <p>Заказов с таким статусом нет</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно деталей */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white dark:bg-[#1a3d3d] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            {/* Заголовок модалки */}
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-start bg-gray-50 dark:bg-black/20">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-dark-teal dark:text-white">
                        Заказ {selectedOrder.orderNumber}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Создан: {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition text-gray-500 hover:text-red-500">
                    <Icon name="close" className="w-6 h-6" />
                </button>
            </div>

            {/* Контент модалки */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
                
                {/* Блоки информации */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Доставка */}
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
                            <Icon name="map-pin" className="w-3 h-3"/> Доставка
                        </h3>
                        <p className="font-bold text-dark-teal dark:text-white text-lg mb-1">{selectedOrder.shippingAddress?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{selectedOrder.shippingAddress?.phone}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedOrder.shippingAddress?.address}</p>
                    </div>
                    
                    {/* Оплата */}
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
                                <Icon name="credit-card" className="w-3 h-3"/> Оплата
                            </h3>
                            <p className="text-sm font-bold text-dark-teal dark:text-white mb-1">
                                {selectedOrder.paymentMethod === 'cash_on_delivery' ? 'Наличные при получении' : selectedOrder.paymentMethod}
                            </p>
                        </div>
                        <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-white/10">
                            <span className="font-bold text-gray-500">Итого:</span>
                            <span className="text-xl font-bold text-accent-rose">{selectedOrder.totalAmount} TJS</span>
                        </div>
                    </div>
                </div>

                {/* Список товаров */}
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">Товары в заказе ({selectedOrder.items.length})</h3>
                <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center border border-gray-100 dark:border-white/10 p-3 rounded-xl hover:shadow-sm transition bg-white dark:bg-white/5">
                            <div className="relative w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <ClientImage src={item.image} fill className="object-cover" alt={item.name} />
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-dark-teal dark:text-white text-sm line-clamp-2">{item.name}</h4>
                                <div className="flex gap-2 mt-1">
                                    {item.size && <span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-medium">{item.size}</span>}
                                    <span className="text-xs text-gray-500">{item.quantity} шт.</span>
                                </div>
                            </div>
                            <div className="font-bold text-dark-teal dark:text-white whitespace-nowrap">
                                {item.price * item.quantity} TJS
                            </div>
                        </div>
                    ))}
                </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}