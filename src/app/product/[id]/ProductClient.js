'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ClientImage from '@/components/ClientImage'; // Убедись, что путь правильный (без src если настроил jsconfig)
import Link from 'next/link';
import ProductCard from '@/components/ProductCard'; // Исправлен путь
import TryOnModal from '@/components/TryOnModal'; // 👈 Наш новый компонент

// Простая функция форматирования даты
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`;
};

export default function ProductClient({ product, similarProducts, reviews }) {
  // --- Состояния ---
  const [error, setError] = useState(null);
  
  // Состояния отзывов
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Состояния галереи
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const modalRef = useRef(null);

  // Состояние для Виртуальной примерки (Новое)
  const [isTryOnOpen, setIsTryOnOpen] = useState(false); 

  // --- Логика ---

  // Массив изображений
  const images = useMemo(() => {
    const list = [];
    if (product?.imageLarge && typeof product.imageLarge === 'string') {
      list.push(product.imageLarge);
    }
    if (product?.image && typeof product.image === 'string' && !product.imageLarge) {
      list.push(product.image);
    }
    if (product?.additionalImages?.length) {
      product.additionalImages.forEach(img => {
        if (typeof img === 'string') list.push(img);
      });
    }
    if (list.length === 0) list.push('/images/placeholder.jpg');
    return list;
  }, [product]);

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  const handleKeyDown = (e) => {
    if (!isFullScreen) return;
    if (e.key === 'Escape') handleCloseFullScreen();
    else if (e.key === 'ArrowLeft') handlePrevImage();
    else if (e.key === 'ArrowRight') handleNextImage();
  };

  useEffect(() => {
    if (isFullScreen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) {
      setReviewError('Имя и комментарий обязательны');
      return;
    }
    try {
      const reviewData = {
        productId: product._id,
        userName: userName.trim(),
        rating: Number(rating),
        comment: comment.trim(),
      };
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      if (!res.ok) throw new Error('Ошибка отправки отзыва');
      setReviewSuccess('Отзыв отправлен!');
      setReviewError(null);
      setUserName('');
      setComment('');
      setRating(5);
    } catch (err) {
      setReviewError('Не удалось отправить отзыв');
    }
  };

  if (!product) {
    return <div className="text-center py-20">Товар не найден</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* --- ЛЕВАЯ КОЛОНКА: ГАЛЕРЕЯ --- */}
        <div>
          <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in" onClick={handleImageClick}>
            <ClientImage
              src={images[currentImageIndex]}
              alt={product.name}
              fill
              className="object-contain"
            />
          </div>

          {/* Миниатюры */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded border-2 ${
                    idx === currentImageIndex ? 'border-accent-rose' : 'border-gray-300'
                  } overflow-hidden`}
                >
                  <ClientImage
                    src={img}
                    alt={`${product.name} - ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Кнопка примерки (Теперь открывает новый компонент) */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsTryOnOpen(true)}
              className="w-full md:w-auto bg-gradient-to-r from-accent-rose to-primary-pink text-white px-8 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all text-lg font-medium flex items-center justify-center gap-2 mx-auto"
            >
              <span>✨</span> Примерить онлайн
            </button>
            <p className="text-xs text-gray-500 mt-2">Примерьте этот наряд на своё фото с помощью AI</p>
          </div>
        </div>

        {/* --- ПРАВАЯ КОЛОНКА: ИНФОРМАЦИЯ --- */}
        <div>
          <h1 className="text-3xl font-bold text-text-dark mb-4">{product.name}</h1>
          <p className="text-2xl font-semibold text-accent-rose mb-6">
            {product.price ? `${product.price} TJS` : 'Цена по запросу'}
          </p>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Описание</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              {product.description.split('. ').filter(Boolean).map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>

          {product.material && <p className="mb-2"><strong>Материал:</strong> {product.material}</p>}
          {product.sizes && <p className="mb-2"><strong>Размеры:</strong> {product.sizes}</p>}
          {product.details && <p className="mb-2"><strong>Детали:</strong> {product.details}</p>}

          {/* Секция Отзывов */}
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Отзывы</h2>
            
            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 mb-8 max-w-md bg-gray-50 p-4 rounded-lg dark:bg-gray-800">
              <h3 className="font-medium">Оставить отзыв</h3>
              <input
                type="text"
                placeholder="Ваше имя"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
              <div className="flex items-center gap-2">
                <span>Оценка:</span>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ★</option>)}
                </select>
              </div>
              <textarea
                placeholder="Ваш комментарий..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="p-2 border rounded h-24 dark:bg-gray-700 dark:border-gray-600"
                required
              />
              <button type="submit" className="bg-dark-teal text-white px-4 py-2 rounded hover:bg-teal-700 transition">
                Отправить отзыв
              </button>
              {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
              {reviewSuccess && <p className="text-green-500 text-sm">{reviewSuccess}</p>}
            </form>

            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map(r => (
                  <div key={r._id} className="p-4 border rounded bg-white dark:bg-gray-800 shadow-sm">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-dark-teal dark:text-gray-200">{r.userName}</p>
                        <span className="text-yellow-500 font-bold">{r.rating} ★</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{r.comment}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDate(r.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">Отзывов пока нет. Будьте первыми!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Похожие товары */}
      {similarProducts.length > 0 && (
        <div className="mt-16 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Вам может понравиться</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Полноэкранный режим */}
      {isFullScreen && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 backdrop-blur-sm"
          tabIndex={-1}
        >
          <button
            onClick={handleCloseFullScreen}
            className="absolute top-4 right-4 text-white text-5xl hover:text-gray-300 transition"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button onClick={handlePrevImage} className="absolute left-4 text-white text-5xl hover:scale-110 transition p-2">‹</button>
              <button onClick={handleNextImage} className="absolute right-4 text-white text-5xl hover:scale-110 transition p-2">›</button>
            </>
          )}

          <ClientImage
            src={images[currentImageIndex]}
            alt={product.name}
            width={1200}
            height={1200}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}

      {/* 👇 НОВЫЙ КОМПОНЕНТ: Модальное окно примерки */}
      <TryOnModal 
        isOpen={isTryOnOpen} 
        onClose={() => setIsTryOnOpen(false)} 
        garmentImage={images[currentImageIndex] || product.image} // Берем текущее выбранное фото
      />
      
    </div>
  );
}