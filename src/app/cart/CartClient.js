'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import ClientImage from '@/components/ClientImage';
import Icon from '@/components/Icon';

export default function CartClient() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [orderStatus, setOrderStatus] = useState(null); // 'loading', 'success', 'error'
  
  // Состояние: если null - покупаем всю корзину, если объект - покупаем конкретный товар
  const [buyNowItem, setBuyNowItem] = useState(null);

  // 1. ОПРЕДЕЛЯЕМ, КАКИЕ ТОВАРЫ МЫ СЕЙЧАС ПОКУПАЕМ
  const itemsToCheckout = buyNowItem ? [buyNowItem] : cart;

  // 2. СЧИТАЕМ СУММУ ТОЛЬКО ДЛЯ ВЫБРАННЫХ ТОВАРОВ
  const itemsTotal = itemsToCheckout.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // 3. ЛОГИКА ДОСТАВКИ (Бесплатно от 250 TJS)
  const SHIPPING_COST = 20; // Стоимость доставки по умолчанию
  const isFreeShipping = itemsTotal >= 250;
  const finalShippingPrice = isFreeShipping ? 0 : SHIPPING_COST;
  
  const finalTotal = itemsTotal + finalShippingPrice;

  // --- ФУНКЦИИ УПРАВЛЕНИЯ (ИСПРАВЛЕНО) ---

  // Кнопка "Оформить все" (для всей корзины)
  const handleMainCheckout = () => {
    setBuyNowItem(null); // Сбрасываем "купить один", значит покупаем всё
    setIsCheckingOut(true); // Открываем форму
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Кнопка "Купить сразу" (для одного товара)
  const handleSingleBuy = (item) => {
    setBuyNowItem(item);
    setIsCheckingOut(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Кнопка "Назад"
  const handleBack = () => {
    setIsCheckingOut(false);
    setBuyNowItem(null);
  };

  // Отправка заказа
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderStatus('loading');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToCheckout, // Отправляем или всю корзину, или один товар
          totalAmount: finalTotal,
          shippingAddress: formData,
          paymentMethod: 'cash_on_delivery'
        }),
      });

      if (!res.ok) throw new Error('Ошибка оформления');

      setOrderStatus('success');
      
      // Умная очистка
      if (buyNowItem) {
        // Если покупали один товар - удаляем только его
        removeFromCart(buyNowItem._id, buyNowItem.selectedSize);
      } else {
        // Если покупали всё - чистим всю корзину
        clearCart();
      }
      
      setBuyNowItem(null);
    } catch (error) {
      console.error(error);
      setOrderStatus('error');
    }
  };

  // --- РЕНДЕРИНГ ---

  if (cart.length === 0 && orderStatus !== 'success') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Icon name="bag" className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-dark-teal dark:text-white mb-2">Корзина пуста</h1>
        <p className="text-gray-500 mb-8">Самое время начать шопинг!</p>
        <Link href="/catalog" className="btn px-8">Перейти в каталог</Link>
      </div>
    );
  }

  if (orderStatus === 'success') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 animate-fadeIn">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 text-4xl">✓</div>
        <h1 className="text-3xl font-serif font-bold text-dark-teal dark:text-white mb-4">Заказ принят!</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8">
          Менеджер свяжется с вами в ближайшее время.
        </p>
        <Link href="/catalog" className="btn px-8">Вернуться в магазин</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-4 py-6 md:py-8">
      {/* Заголовок */}
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-dark-teal dark:text-white mb-6 md:mb-8 px-4 md:px-0">
        {isCheckingOut 
          ? (buyNowItem ? 'Оформление товара' : 'Оформление заказа') 
          : 'Корзина'
        }
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА: СПИСОК ТОВАРОВ */}
        <div className={`flex-grow space-y-4 ${isCheckingOut && buyNowItem ? 'hidden md:block' : ''} px-4 md:px-0`}>
          {(isCheckingOut && buyNowItem ? [buyNowItem] : cart).map((item) => (
            <div key={`${item._id}-${item.selectedSize}`} className="bg-white dark:bg-white/5 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 flex gap-4 items-start relative overflow-hidden">
              
              <div className="relative w-24 h-32 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                <ClientImage src={item.image} alt={item.name} fill className="object-cover" />
              </div>

              <div className="flex-grow flex flex-col justify-between min-h-[8rem]">
                <div>
                    <div className="flex justify-between items-start pr-8">
                        <Link href={`/product/${item._id}`} className="font-bold text-dark-teal dark:text-white hover:text-accent-rose transition-colors line-clamp-1 text-lg">
                        {item.name}
                        </Link>
                        {/* Кнопка удаления (скрываем при оформлении) */}
                        {!isCheckingOut && (
                            <button onClick={() => removeFromCart(item._id, item.selectedSize)} className="text-gray-300 hover:text-red-500 transition-colors absolute top-4 right-4">
                                <Icon name="close" className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {item.selectedSize && (
                        <p className="text-sm text-gray-500 mt-1">Размер: {item.selectedSize}</p>
                    )}
                </div>

                <div className="flex flex-wrap justify-between items-end gap-4 mt-2">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/10 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item._id, item.selectedSize, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-white/20 rounded-md transition-colors font-bold text-gray-500">−</button>
                    <span className="font-bold w-6 text-center text-dark-teal dark:text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.selectedSize, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-white/20 rounded-md transition-colors font-bold text-gray-500">+</button>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                      <p className="font-bold text-xl text-dark-teal dark:text-white">
                        {item.price * item.quantity} TJS
                      </p>
                      
                      {/* КНОПКА "КУПИТЬ ЭТОТ" */}
                      {!isCheckingOut && (
                        <button 
                            onClick={() => handleSingleBuy(item)}
                            className="text-xs font-bold text-white bg-dark-teal px-4 py-2 rounded-lg hover:bg-primary-pink hover:text-dark-teal transition-all shadow-md active:scale-95"
                        >
                            Оформить этот
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ПРАВАЯ КОЛОНКА: ИТОГО И ФОРМА */}
        <div className="lg:w-96 flex-shrink-0 px-4 md:px-0 pb-10 lg:pb-0">
          <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-white/10 sticky top-24">
            <h2 className="text-xl font-bold mb-6 text-dark-teal dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
                {isCheckingOut ? 'Ваш заказ' : 'Сумма заказа'}
            </h2>
            
            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Товары ({itemsToCheckout.reduce((a, c) => a + c.quantity, 0)} шт.)</span>
                <span>{itemsTotal} TJS</span>
                </div>
                
                <div className="flex justify-between text-gray-600 dark:text-gray-300 items-center">
                <span>Доставка</span>
                {isFreeShipping ? (
                    <span className="text-green-500 font-bold text-sm bg-green-50 px-2 py-0.5 rounded">Бесплатно</span>
                ) : (
                    <span>{SHIPPING_COST} TJS</span>
                )}
                </div>
                {!isFreeShipping && (
                    <p className="text-xs text-gray-400 text-right">
                        До бесплатной доставки: {250 - itemsTotal} TJS
                    </p>
                )}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6 flex justify-between items-end">
              <span className="font-bold text-lg text-dark-teal dark:text-white">Итого:</span>
              <span className="font-bold text-3xl text-accent-rose">{finalTotal} <span className="text-lg text-gray-500 font-normal">TJS</span></span>
            </div>

            {/* КНОПКА ПЕРЕХОДА К ОФОРМЛЕНИЮ (ДЛЯ ВСЕХ ТОВАРОВ) */}
            {!isCheckingOut ? (
              <button 
                onClick={handleMainCheckout} 
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-accent-rose to-primary-pink shadow-lg hover:shadow-pink-500/40 hover:-translate-y-1 transition-all active:scale-95"
              >
                Оформить все ({cart.length})
              </button>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-4 animate-fadeIn">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Ваше имя</label>
                    <input 
                    type="text" placeholder="Например: Мадина" required 
                    className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/10 dark:border-gray-600 focus:outline-none focus:border-primary-pink transition-colors"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Телефон</label>
                    <input 
                    type="tel" placeholder="+992..." required 
                    className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/10 dark:border-gray-600 focus:outline-none focus:border-primary-pink transition-colors"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Адрес доставки</label>
                    <textarea 
                    placeholder="Город, улица, дом..." required rows={2}
                    className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/10 dark:border-gray-600 focus:outline-none focus:border-primary-pink transition-colors resize-none"
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                </div>
                
                <div className="flex gap-3 pt-2">
                   <button 
                    type="button" 
                    onClick={handleBack} 
                    className="flex-1 py-3 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                   >
                    Назад
                   </button>
                   <button 
                    type="submit" 
                    disabled={orderStatus === 'loading'} 
                    className="flex-[2] py-3 rounded-xl font-bold text-white bg-dark-teal hover:bg-primary-pink transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                     {orderStatus === 'loading' ? 'Оформляем...' : 'Подтвердить'}
                   </button>
                </div>
                {orderStatus === 'error' && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">Ошибка при заказе. Попробуйте еще раз.</p>}
              </form>
            )}
            
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
              <Icon name="check" className="w-4 h-4" />
              <span>Оплата наличными при получении</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}