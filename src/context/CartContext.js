'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загружаем корзину из localStorage при старте
  useEffect(() => {
    const savedCart = localStorage.getItem('parizod_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Ошибка разбора корзины', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Сохраняем корзину при каждом изменении
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('parizod_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (product, quantity = 1, size = null) => {
    setCart((prev) => {
      // Ищем, есть ли уже такой товар с таким же размером
      const existingIndex = prev.findIndex(
        (item) => item._id === product._id && item.selectedSize === size
      );

      if (existingIndex >= 0) {
        // Если есть, увеличиваем количество
        const newCart = [...prev];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      } else {
        // Если нет, добавляем новый
        return [
          ...prev,
          {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            selectedSize: size,
            quantity: quantity,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId, size) => {
    setCart((prev) => prev.filter((item) => !(item._id === productId && item.selectedSize === size)));
  };

  const updateQuantity = (productId, size, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item._id === productId && item.selectedSize === size) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  // Подсчет итогов
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}