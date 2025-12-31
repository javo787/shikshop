'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ClientImage from '@/components/ClientImage';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import TryOnModal from '@/components/TryOnModal';
import Icon from '@/components/Icon';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext'; // <--- Новый импорт для корзины

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`;
};

export default function ProductClient({ product, similarProducts, reviews }) {
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const modalRef = useRef(null);

  // 👇 Подключаем хуки
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(product?._id);
  const { addToCart } = useCart(); // <--- Хук корзины
  const [selectedSize, setSelectedSize] = useState('');
  const [isAdded, setIsAdded] = useState(false); // Для анимации галочки

  // Парсим размеры (строка "S,M,L" -> массив ["S", "M", "L"])
  const availableSizes = useMemo(() => {
    return product?.sizes ? product.sizes.split(',').map(s => s.trim()) : [];
  }, [product]);

  const images = useMemo(() => {
    const list = [];
    if (product?.imageLarge) list.push(product.imageLarge);
    if (product?.image && !product.imageLarge) list.push(product.image);
    if (product?.additionalImages?.length) {
      product.additionalImages.forEach(img => list.push(img));
    }
    if (list.length === 0) list.push('/images/placeholder.jpg');
    return list;
  }, [product]);

  const handleOpenTryOn = () => setIsTryOnOpen(true);
  const handleCloseTryOn = () => setIsTryOnOpen(false);

  const handleThumbnailClick = (index) => setCurrentImageIndex(index);
  const handleImageClick = () => setIsFullScreen(true);
  const handleCloseFullScreen = useCallback(() => setIsFullScreen(false), []);

  const handleKeyDown = useCallback((e) => {
    if (!isFullScreen) return;
    if (e.key === 'Escape') handleCloseFullScreen();
    if (e.key === 'ArrowLeft') setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    if (e.key === 'ArrowRight') setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [isFullScreen, images.length, handleCloseFullScreen]);

  useEffect(() => {
    if (isFullScreen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isFullScreen, handleKeyDown]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) {
      setReviewError('Имя и комментарий обязательны');
      return;
    }
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          userName: userName.trim(),
          rating: Number(rating),
          comment: comment.trim(),
        }),
      });
      if (!res.ok) throw new Error('Ошибка');
      setReviewSuccess('Отзыв отправлен!');
      setReviewError(null);
      setUserName('');
      setComment('');
    } catch (err) {
      setReviewError('Не удалось отправить отзыв');
    }
  };

  const handleAddToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      alert('Пожалуйста, выберите размер');
      return;
    }
    
    addToCart(product, 1, selectedSize || null);
    
    // Анимация успеха
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (!product) return <div className="text-center py-20">Товар не найден</div>;

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="grid md:grid-cols-2 gap-8">
        {/* ЛЕВАЯ КОЛОНКА: Фотографии */}
        <div>
          {/* Главное фото */}
          <div 
            className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in z-0" 
            onClick={handleImageClick}
          >
            <ClientImage
              src={images[currentImageIndex]}
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Миниатюры */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                    idx === currentImageIndex ? 'border-accent-rose' : 'border-gray-300'
                  }`}
                >
                  <ClientImage src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: Описание и Отзывы */}
        <div>
          <h1 className="text-3xl font-bold text-text-dark dark:text-white mb-4">{product.name}</h1>
          <p className="text-2xl font-semibold text-accent-rose mb-6">
            {product.price ? `${product.price} TJS` : 'Цена по запросу'}
          </p>
          <div className="mb-6">
            <h3 className="font-semibold mb-2 text-dark-teal dark:text-white">Описание</h3>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {product.description}
            </div>
          </div>
          {product.material && <p className="mb-2 dark:text-gray-300"><strong>Материал:</strong> {product.material}</p>}
          {product.sizes && <p className="mb-2 dark:text-gray-300"><strong>Размеры:</strong> {product.sizes}</p>}
          
          {/* Блок действий (Выбор размера + Кнопки) */}
          <div className="mt-6 flex flex-col gap-4 max-w-md mx-auto md:mx-0">
            {/* Выбор размера (если есть) */}
            {availableSizes.length > 0 && (
              <div>
                <p className="text-sm font-bold text-dark-teal dark:text-white mb-2">Выберите размер:</p>
                <div className="flex gap-2">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 rounded-lg border transition-all ${
                        selectedSize === size 
                          ? 'bg-dark-teal text-white border-dark-teal' 
                          : 'border-gray-300 hover:border-dark-teal dark:text-white dark:border-gray-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {/* Кнопка В КОРЗИНУ */}
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg ${
                  isAdded 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-dark-teal hover:bg-opacity-90'
                }`}
              >
                {isAdded ? '✓ Добавлено' : 'В корзину'}
              </button>

              {/* Кнопка ИЗБРАННОЕ (маленькая) */}
              <button
                onClick={() => toggleFavorite(product._id)}
                className="p-3 rounded-xl border border-gray-300 hover:border-accent-rose hover:text-accent-rose transition-colors dark:border-gray-600 dark:text-white"
              >
                <Icon name="heart" className={`w-6 h-6 ${liked ? 'fill-current text-accent-rose' : ''}`} />
              </button>
            </div>

            {/* Кнопка ПРИМЕРИТЬ */}
            <button
              onClick={handleOpenTryOn}
              className="w-full bg-gradient-to-r from-accent-rose to-primary-pink text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all"
            >
              ✨ Примерить онлайн
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Примерьте этот наряд на своё фото с помощью AI
            </p>
          </div>

          {/* Секция отзывов */}
          <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-teal dark:text-white">Отзывы</h2>
            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 mb-8 bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
              <input 
                type="text" 
                placeholder="Ваше имя" 
                value={userName} 
                onChange={e => setUserName(e.target.value)} 
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                required 
              />
              <select 
                value={rating} 
                onChange={e => setRating(Number(e.target.value))} 
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
              <textarea 
                placeholder="Комментарий..." 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                className="p-2 border rounded h-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                required 
              />
              <button type="submit" className="bg-dark-teal text-white px-4 py-2 rounded hover:bg-opacity-90 transition">
                Отправить
              </button>
              {reviewError && <p className="text-red-500">{reviewError}</p>}
              {reviewSuccess && <p className="text-green-500">{reviewSuccess}</p>}
            </form>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-white/5">
                  <div className="flex justify-between">
                    <span className="font-bold text-dark-teal dark:text-white">{r.userName}</span>
                    <span className="text-yellow-500">{r.rating} ★</span>
                  </div>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{r.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(r.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 👇 БЛОК ПОХОЖИХ ТОВАРОВ */}
      {similarProducts?.length > 0 && (
        <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-3xl font-serif font-bold mb-8 text-center text-dark-teal dark:text-white">
            Похожие товары
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map(p => (
              // Мы используем ProductCard, который уже обновлен и имеет кнопку лайка
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {isFullScreen && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] backdrop-blur-sm"
          onClick={handleCloseFullScreen}
        >
          <button onClick={handleCloseFullScreen} className="absolute top-4 right-4 text-white text-5xl hover:text-gray-300 transition z-[101]">&times;</button>
          <div className="relative w-[90vw] h-[90vh]" onClick={e => e.stopPropagation()}>
             <ClientImage src={images[currentImageIndex]} alt={product.name} fill className="object-contain" />
          </div>
        </div>
      )}

      <TryOnModal 
        isOpen={isTryOnOpen} 
        onClose={handleCloseTryOn} 
        garmentImage={images[currentImageIndex] || product.image} 
      />
    </div>
  );
}