'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]); // Массив ID любимых товаров
  const [user, setUser] = useState(null);

  // 1. При загрузке сайта проверяем юзера и качаем его избранное
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const res = await fetch(`/api/users/${currentUser.uid}`);
          if (res.ok) {
            const data = await res.json();
            // Проверяем формат данных: может прийти массив ID или массив объектов
            if (data.favorites && Array.isArray(data.favorites)) {
                 setFavorites(data.favorites);
            } else if (data.favoritesData) {
                 setFavorites(data.favoritesData.map(p => p._id));
            }
          }
        } catch (error) {
          console.error('Failed to load favorites', error);
        }
      } else {
        setFavorites([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Функция переключения лайка
  const toggleFavorite = async (productId) => {
    if (!user) {
      alert('Войдите в аккаунт, чтобы сохранять товары в избранное ❤️');
      // В будущем здесь можно открывать модальное окно входа
      return;
    }

    // Оптимистичный UI: меняем состояние сразу, не ждем сервер
    const isAlreadyFavorite = favorites.includes(productId);
    const newFavorites = isAlreadyFavorite
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    
    setFavorites(newFavorites);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid, productId }),
      });
      
      if (!res.ok) {
        // Если ошибка — возвращаем как было
        setFavorites(favorites);
        console.error('Server failed to update favorite');
      }
    } catch (error) {
      setFavorites(favorites);
      console.error('Connection error', error);
    }
  };

  const isFavorite = (productId) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}