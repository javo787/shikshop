'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ClientImage from '@/components/ClientImage';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import TryOnModal from '@/components/TryOnModal';
// 👇 Новые импорты для избранного
import Icon from '@/components/Icon';
import { useFavorites } from '@/context/FavoritesContext';

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

  // 👇 Подключаем хук избранного
  const { isFavorite, toggleFavorite } = useFavorites();
  // Проверяем, лайкнут ли текущий товар
  const liked = isFavorite(product?._id);

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

          {/* КНОПКИ ДЕЙСТВИЙ (Примерить + Избранное) */}
          <div className="mt-6 flex flex-col gap-3 items-center">
            {/* Кнопка ПРИМЕРИТЬ */}
            <button
              onClick={handleOpenTryOn}
              className="w-full md:w-auto bg-gradient-to-r from-accent-rose to-primary-pink text-white px-8 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all text-lg font-medium flex items-center justify-center gap-2 mx-auto"
            >
              <span>✨</span> Примерить онлайн
            </button>

            {/* 👇 КНОПКА ИЗБРАННОЕ */}
            <button
              onClick={() => toggleFavorite(product._id)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all w-full md:w-auto justify-center ${
                liked 
                  ? 'border-accent-rose text-accent-rose bg-red-50 dark:bg-white/10' 
                  : 'border-gray-300 text-gray-600 dark:text-gray-300 hover:border-accent-rose hover:text-accent-rose'
              }`}
            >
              <Icon name="heart" className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              {liked ? 'В избранном' : 'Добавить в избранное'}
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Примерьте этот наряд на своё фото с помощью AI
            </p>
          </div>
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