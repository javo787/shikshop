'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import ClientImage from '@/components/ClientImage';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); // Для модального окна деталей

  // Загрузка заказов
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
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  // Изменение статуса
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      if (res.ok) {
        // Обновляем локальный стейт, чтобы не перезагружать страницу
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
            setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  // Цвета для статусов
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: 'Новый',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменен'
    };
    return labels[status] || status;
  };

  if (loading) return <div className="p-10 text-center">Загрузка заказов...</div>;

  return (
    <div className="min-h-screen bg-bg-light dark:bg-dark-teal p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div>
                <Link href="/admin" className="text-gray-500 hover:text-primary-pink text-sm mb-2 inline-block">← Назад в меню</Link>
                <h1 className="text-3xl font-serif font-bold text-dark-teal dark:text-white">Управление заказами</h1>
            </div>
            <button onClick={fetchOrders} className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm hover:shadow-md transition">
                <Icon name="refresh" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
        </div>

        {/* Таблица заказов (Desktop) */}
        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 text-xs uppercase font-bold">
                <tr>
                  <th className="p-4">№ Заказа</th>
                  <th className="p-4">Дата</th>
                  <th className="p-4">Клиент</th>
                  <th className="p-4">Сумма</th>
                  <th className="p-4">Статус</th>
                  <th className="p-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-sm font-bold text-dark-teal dark:text-white">
                      {order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      <br/>
                      <span className="text-xs opacity-70">{new Date(order.createdAt).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-dark-teal dark:text-white">{order.shippingAddress?.name || 'Гость'}</div>
                      <div className="text-xs text-gray-500">{order.shippingAddress?.phone}</div>
                    </td>
                    <td className="p-4 font-bold text-accent-rose">
                      {order.totalAmount} TJS
                    </td>
                    <td className="p-4">
                      <select 
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-full border appearance-none cursor-pointer outline-none focus:ring-2 ring-primary-pink ${getStatusColor(order.status)}`}
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
                        className="text-sm font-bold text-dark-teal hover:text-primary-pink underline"
                      >
                        Детали
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                    <tr>
                        <td colSpan="6" className="p-10 text-center text-gray-400">Заказов пока нет</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Модальное окно деталей */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white dark:bg-[#1a3d3d] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
            
            {/* Шапка модалки */}
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-dark-teal dark:text-white">
                        Заказ {selectedOrder.orderNumber}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        от {new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}
                    </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
                    <Icon name="close" className="w-6 h-6 text-gray-400" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
                {/* Секция доставки */}
                <div className="mb-6 bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-3">Данные доставки</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-gray-400 block">Имя</span>
                            <span className="text-dark-teal dark:text-white font-medium">{selectedOrder.shippingAddress?.name}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block">Телефон</span>
                            <span className="text-dark-teal dark:text-white font-medium">{selectedOrder.shippingAddress?.phone}</span>
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-xs text-gray-400 block">Адрес</span>
                            <span className="text-dark-teal dark:text-white font-medium">{selectedOrder.shippingAddress?.address}</span>
                        </div>
                    </div>
                </div>

                {/* Список товаров */}
                <div>
                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-3">Товары ({selectedOrder.items.length})</h3>
                    <div className="space-y-3">
                        {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center border-b border-gray-100 dark:border-white/5 pb-3 last:border-0 last:pb-0">
                                <div className="relative w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <ClientImage src={item.image} fill className="object-cover" alt={item.name} />
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-bold text-dark-teal dark:text-white text-sm line-clamp-2">{item.name}</h4>
                                    {item.size && <span className="text-xs text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded mr-2">{item.size}</span>}
                                    <span className="text-xs text-gray-500">{item.quantity} шт. x {item.price} TJS</span>
                                </div>
                                <div className="font-bold text-dark-teal dark:text-white">
                                    {item.price * item.quantity} TJS
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Подвал с итогом */}
            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
                <span className="font-bold text-lg text-dark-teal dark:text-white">Итого к оплате:</span>
                <span className="font-bold text-2xl text-accent-rose">{selectedOrder.totalAmount} TJS</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}