'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ClientImage from '@/components/ClientImage';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import TryOnModal from '@/components/TryOnModal';

// Простая функция форматирования даты
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

  // Собираем картинки в массив
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
      document.body.style.overflow = 'hidden'; // Блокируем прокрутку
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

  if (!product) return <div className="text-center py-20">Товар не найден</div>;

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* --- ЛЕВАЯ КОЛОНКА: ГАЛЕРЕЯ --- */}
        <div>
          {/* Главное изображение */}
          <div 
            className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in z-0" 
            onClick={handleImageClick}
          >
            <ClientImage
              src={images[currentImageIndex]}
              alt={product.name}
              fill
              className="object-contain"
              priority // Загружать сразу
            />
          </div>

          {/* Миниатюры */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                    idx === currentImageIndex ? 'border-accent-rose' : 'border-gray-300'
                  }`}
                >
                  <ClientImage src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Кнопка примерки */}
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
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {product.description}
            </div>
          </div>

          {product.material && <p className="mb-2"><strong>Материал:</strong> {product.material}</p>}
          {product.sizes && <p className="mb-2"><strong>Размеры:</strong> {product.sizes}</p>}

          {/* Отзывы */}
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Отзывы</h2>
            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 mb-8 bg-gray-50 p-4 rounded-lg dark:bg-gray-800">
              <input type="text" placeholder="Ваше имя" value={userName} onChange={e => setUserName(e.target.value)} className="p-2 border rounded" required />
              <select value={rating} onChange={e => setRating(Number(e.target.value))} className="p-2 border rounded">
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
              <textarea placeholder="Комментарий..." value={comment} onChange={e => setComment(e.target.value)} className="p-2 border rounded h-24" required />
              <button type="submit" className="bg-dark-teal text-white px-4 py-2 rounded">Отправить</button>
              {reviewError && <p className="text-red-500">{reviewError}</p>}
              {reviewSuccess && <p className="text-green-500">{reviewSuccess}</p>}
            </form>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r._id} className="p-4 border rounded bg-white dark:bg-gray-800">
                  <div className="flex justify-between"><span className="font-bold">{r.userName}</span><span className="text-yellow-500">{r.rating} ★</span></div>
                  <p className="mt-1">{r.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(r.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Похожие товары */}
      {similarProducts?.length > 0 && (
        <div className="mt-16 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Вам может понравиться</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}

      {/* Модальное окно (FullScreen) - Скрыто по умолчанию */}
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

      {/* Модальное окно (TryOn) */}
      <TryOnModal 
        isOpen={isTryOnOpen} 
        onClose={() => setIsTryOnOpen(false)} 
        garmentImage={images[currentImageIndex] || product.image} 
      />
    </div>
  );
}