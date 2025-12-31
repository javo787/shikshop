'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Для переадресации
import { onAuthStateChanged } from 'firebase/auth'; // Для проверки юзера
import { auth } from '@/lib/firebase';
import ClientImage from '@/components/ClientImage';
import ProductCard from '@/components/ProductCard';
import TryOnModal from '@/components/TryOnModal';
import Icon from '@/components/Icon';
import AuthRequestModal from '@/components/AuthRequestModal'; // <--- Импортируем наше новое окно
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`;
};

export default function ProductClient({ product, similarProducts, reviews }) {
  const router = useRouter();
  
  // Состояния для отзывов
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Состояния интерфейса
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [isAdded, setIsAdded] = useState(false);
  
  // Состояния авторизации
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Свайпы (Touch gestures)
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const modalRef = useRef(null);

  // Хуки контекста
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  
  const liked = isFavorite(product?._id);

  // 1. Проверяем авторизацию при загрузке
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Парсинг размеров
  const availableSizes = useMemo(() => {
    return product?.sizes ? product.sizes.split(',').map(s => s.trim()) : [];
  }, [product]);

  // Сбор всех картинок в один массив
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

  // --- ЛОГИКА СВАЙПОВ (ЛИСТАНИЕ) ---
  const minSwipeDistance = 50; 

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };
  // ---------------------------------

  // --- ПРОВЕРКА АВТОРИЗАЦИИ ПЕРЕД ДЕЙСТВИЕМ ---
  const handleAuthAction = (actionCallback) => {
    if (!user) {
      setShowAuthModal(true); // Показываем вежливое окно
    } else {
      actionCallback(); // Если вошел, выполняем действие
    }
  };

  // --------------------------------------------

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
    // Здесь тоже можно добавить проверку, если отзывы только для юзеров
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

  // ДОБАВИТЬ В КОРЗИНУ
  const handleAddToCart = () => {
    handleAuthAction(() => {
      if (availableSizes.length > 0 && !selectedSize) {
        alert('Пожалуйста, выберите размер');
        return;
      }
      addToCart(product, 1, selectedSize || null);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    });
  };

  // ЗАКАЗАТЬ СЕЙЧАС (BUY NOW)
  const handleBuyNow = () => {
    handleAuthAction(() => {
      if (availableSizes.length > 0 && !selectedSize) {
        alert('Пожалуйста, выберите размер перед покупкой');
        return;
      }
      // Добавляем и сразу переходим в корзину
      addToCart(product, 1, selectedSize || null);
      router.push('/cart');
    });
  };

  // ЛАЙКНУТЬ
  const handleLike = () => {
    handleAuthAction(() => {
      toggleFavorite(product._id);
    });
  };

  if (!product) return <div className="text-center py-20">Товар не найден</div>;

  return (
    <div className="container mx-auto px-4 py-8 relative">
      
      {/* Модальное окно авторизации */}
      <AuthRequestModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div className="grid md:grid-cols-2 gap-8">
        {/* ЛЕВАЯ КОЛОНКА: Фотографии */}
        <div>
          {/* Главное фото со свайпами */}
          <div 
            className="relative w-full aspect-square bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden cursor-zoom-in z-0 shadow-sm border border-gray-100 dark:border-white/10 group" 
            onClick={handleImageClick}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <ClientImage
              src={images[currentImageIndex]}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              priority
            />
            
            {/* Индикатор количества фото (для мобильных) */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
                {currentImageIndex + 1} / {images.length}
            </div>

            {/* Стрелки навигации (для десктопа) */}
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
              className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-dark-teal opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
            >
              <Icon name="arrow-left" className="w-5 h-5 rotate-180" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
              className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md text-dark-teal opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
            >
               <Icon name="arrow-right" className="w-5 h-5" />
            </button>
          </div>

          {/* Миниатюры */}
          {images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`relative flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex 
                      ? 'border-accent-rose scale-105 shadow-md' 
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <ClientImage src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: Описание и Отзывы */}
        <div className="flex flex-col h-full">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-dark-teal dark:text-white mb-2">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
                <p className="text-3xl font-bold text-accent-rose">
                    {product.price ? `${product.price} TJS` : 'Цена по запросу'}
                </p>
                {/* Бейдж наличия */}
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                    В наличии
                </span>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-8 text-gray-600 dark:text-gray-300">
              <p>{product.description}</p>
              {product.material && <p className="mb-1"><strong>Материал:</strong> {product.material}</p>}
              {product.sizes && <p><strong>Доступные размеры:</strong> {product.sizes}</p>}
            </div>
          </div>
          
          {/* Блок действий (Sticky на мобильных для удобства можно сделать, но пока оставим в потоке) */}
          <div className="mt-auto bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-lg">
            
            {/* Выбор размера */}
            {availableSizes.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-dark-teal dark:text-white uppercase tracking-wider">Выберите размер</p>
                    <button className="text-xs text-primary-pink underline decoration-dotted">Таблица размеров</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] h-12 px-2 rounded-xl font-bold border transition-all duration-200 ${
                        selectedSize === size 
                          ? 'bg-dark-teal text-white border-dark-teal shadow-lg scale-105' 
                          : 'border-gray-200 text-gray-600 hover:border-primary-pink dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* КНОПКИ ДЕЙСТВИЯ */}
            <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                    {/* Кнопка В КОРЗИНУ */}
                    <button
                        onClick={handleAddToCart}
                        className={`flex-1 py-4 px-6 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                        isAdded 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-dark-teal hover:bg-opacity-90'
                        }`}
                    >
                        {isAdded ? (
                            <><span>✓</span> Добавлено</>
                        ) : (
                            <><span>🛒</span> В корзину</>
                        )}
                    </button>

                    {/* Кнопка ЛАЙК (Сердечко) */}
                    <button
                        onClick={handleLike}
                        className={`p-4 rounded-xl border-2 transition-all active:scale-90 ${
                            liked 
                            ? 'border-accent-rose bg-accent-rose/10' 
                            : 'border-gray-200 hover:border-accent-rose dark:border-gray-600'
                        }`}
                    >
                        <Icon 
                            name="heart" 
                            className={`w-6 h-6 transition-colors duration-300 ${
                                liked ? 'fill-accent-rose text-accent-rose' : 'text-gray-400 hover:text-accent-rose'
                            }`} 
                        />
                    </button>
                </div>

                {/* Кнопка КУПИТЬ СЕЙЧАС (ЗАКАЗАТЬ) */}
                <button
                    onClick={handleBuyNow}
                    className="w-full py-4 rounded-xl font-bold text-dark-teal border-2 border-primary-pink bg-primary-pink/10 hover:bg-primary-pink hover:text-white transition-all uppercase tracking-wide active:scale-95"
                >
                    Заказать сейчас
                </button>

                {/* Кнопка ПРИМЕРИТЬ */}
                <button
                    onClick={handleOpenTryOn}
                    className="w-full mt-2 bg-gradient-to-r from-purple-500 to-primary-pink text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
                >
                    <span>✨</span> Примерить онлайн
                </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Секция отзывов */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-serif font-bold mb-6 text-dark-teal dark:text-white text-center">Отзывы покупателей</h2>
        
        <form onSubmit={handleReviewSubmit} className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input 
              type="text" 
              placeholder="Ваше имя" 
              value={userName} 
              onChange={e => setUserName(e.target.value)} 
              className="p-3 rounded-xl border bg-gray-50 dark:bg-white/10 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors w-full" 
              required 
            />
            <div className="relative">
                <select 
                value={rating} 
                onChange={e => setRating(Number(e.target.value))} 
                className="p-3 rounded-xl border bg-gray-50 dark:bg-white/10 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors w-full appearance-none cursor-pointer"
                >
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Звезд{r === 1 ? 'а' : (r > 1 && r < 5) ? 'ы' : ''}</option>)}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">★</span>
            </div>
          </div>
          
          <textarea 
            placeholder="Расскажите о своих впечатлениях..." 
            value={comment} 
            onChange={e => setComment(e.target.value)} 
            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-white/10 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors h-32 resize-none mb-4" 
            required 
          />
          
          <div className="flex items-center justify-between">
            <div>
                 {reviewError && <p className="text-red-500 text-sm animate-pulse">{reviewError}</p>}
                 {reviewSuccess && <p className="text-green-500 text-sm">{reviewSuccess}</p>}
            </div>
            <button type="submit" className="btn px-8 py-3">
              Отправить отзыв
            </button>
          </div>
        </form>

        <div className="space-y-4">
            {reviews.length > 0 ? reviews.map(r => (
            <div key={r._id} className="p-6 border border-gray-100 dark:border-white/10 rounded-2xl bg-white dark:bg-white/5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center font-bold text-dark-teal">
                            {r.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span className="font-bold text-dark-teal dark:text-white block">{r.userName}</span>
                            <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                        </div>
                    </div>
                    <div className="flex text-yellow-400 text-lg">
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 ml-13 pl-13 leading-relaxed">{r.comment}</p>
            </div>
            )) : (
                <p className="text-center text-gray-400 py-10">Пока нет отзывов. Будьте первым!</p>
            )}
        </div>
      </div>

      {/* БЛОК ПОХОЖИХ ТОВАРОВ */}
      {similarProducts?.length > 0 && (
        <div className="mt-20 border-t border-gray-200 dark:border-gray-700 pt-10">
          <h2 className="text-3xl font-serif font-bold mb-10 text-center text-dark-teal dark:text-white">
            Вам также может понравиться
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Полноэкранный просмотр */}
      {isFullScreen && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] backdrop-blur-md animate-fadeIn"
          onClick={handleCloseFullScreen}
        >
          <button onClick={handleCloseFullScreen} className="absolute top-6 right-6 text-white/50 hover:text-white transition z-[101]">
             <Icon name="close" className="w-10 h-10" />
          </button>
          
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] p-4 flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <ClientImage src={images[currentImageIndex]} alt={product.name} fill className="object-contain" />
          </div>

          {/* Стрелки в фулскрине */}
          <button 
             className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4"
             onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
          >
             <Icon name="arrow-left" className="w-12 h-12 rotate-180" />
          </button>
          <button 
             className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4"
             onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
          >
             <Icon name="arrow-right" className="w-12 h-12" />
          </button>
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