'use client';

<<<<<<< HEAD
import { useState, useEffect, useMemo } from 'react';
=======
import { useState, useEffect, useRef, useMemo } from 'react';
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import ClientImage from '@/components/ClientImage';
import ProductCard from '@/components/ProductCard';
import TryOnModal from '@/components/TryOnModal';
import Icon from '@/components/Icon';
import AuthRequestModal from '@/components/AuthRequestModal';
import TryOnSuggestion from '@/components/TryOnSuggestion';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`;
};

export default function ProductClient({ product, similarProducts, reviews }) {
  const router = useRouter();
  
  // --- STATE ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Состояния для примерки
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false); // 🔥 Модалка выбора цвета
  const [selectedTryOnImage, setSelectedTryOnImage] = useState(null);    // 🔥 Выбранное фото для AI

  const [selectedSize, setSelectedSize] = useState('');
  const [isAdded, setIsAdded] = useState(false);
  
  // Отзывы
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // User Auth
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Hooks
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const liked = isFavorite(product?._id);

  // Свайпы
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const availableSizes = useMemo(() => product?.sizes ? product.sizes.split(',').map(s => s.trim()) : [], [product]);

  // --- MEMO: СБОР ВСЕХ ИЗОБРАЖЕНИЙ ДЛЯ ГАЛЕРЕИ ---
  const images = useMemo(() => {
    const list = [];
    if (product?.image) list.push(product.image); // Главное
    if (product?.imageLarge && product.imageLarge !== product.image) list.push(product.imageLarge);
    if (product?.additionalImages?.length) product.additionalImages.forEach(img => list.push(img));
    
    // Если список пуст, ставим заглушку
    if (list.length === 0) list.push('/images/placeholder.jpg');
    return list;
  }, [product]);

  // --- MEMO: СБОР ВАРИАНТОВ ДЛЯ AI ПРИМЕРКИ ---
  const aiVariants = useMemo(() => {
    // 1. Приоритет: массив специально загруженных вариантов
    if (product?.tryOnImages && product.tryOnImages.length > 0) return product.tryOnImages;
    // 2. Старое поле (одиночное)
    if (product?.tryOnImage) return [product.tryOnImage];
    // 3. Fallback: используем большое фото товара
    return [product?.imageLarge || product?.image];
  }, [product]);

  // --- ЛОГИКА СВАЙПОВ ---
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    if (distance < -minSwipeDistance) setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

<<<<<<< HEAD
=======
  const handleOpenTryOn = () => setIsTryOnOpen(true);
  
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
  const handleAuthAction = (actionCallback) => {
    if (!user) setShowAuthModal(true);
    else actionCallback();
  };

  const handleAddToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) { alert('Пожалуйста, выберите размер'); return; }
    addToCart(product, 1, selectedSize || null);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (availableSizes.length > 0 && !selectedSize) { alert('Пожалуйста, выберите размер'); return; }
    addToCart(product, 1, selectedSize || null);
    router.push('/cart');
  };

<<<<<<< HEAD
  // --- 🔥 ЛОГИКА ЗАПУСКА ПРИМЕРКИ ---
  const handleTryOnClick = () => {
    // Если вариантов больше одного (разные цвета), показываем выбор
    if (aiVariants.length > 1) {
        setShowVariantSelector(true);
    } else {
        // Если вариант один, сразу открываем модалку с ним
        setSelectedTryOnImage(aiVariants[0]);
        setIsTryOnOpen(true);
    }
  };

  const handleVariantSelect = (img) => {
      setSelectedTryOnImage(img);
      setShowVariantSelector(false);
      setIsTryOnOpen(true);
  };

=======
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) return setReviewError('Заполните все поля');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, userName, rating, comment }),
      });
      if (!res.ok) throw new Error();
      setReviewSuccess('Отзыв отправлен!');
      setUserName(''); setComment('');
    } catch (err) { setReviewError('Ошибка отправки'); }
  };

  if (!product) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f2424]">
<<<<<<< HEAD
      {/* Подсказка для примерки */}
      <TryOnSuggestion onOpen={handleTryOnClick} />
      
      {/* Модалка авторизации */}
=======
      <TryOnSuggestion onOpen={handleOpenTryOn} />
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
      <AuthRequestModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* 🔥 МОДАЛКА ВЫБОРА ЦВЕТА (ПОЯВЛЯЕТСЯ ТОЛЬКО ЕСЛИ МНОГО ВАРИАНТОВ) */}
      {showVariantSelector && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={() => setShowVariantSelector(false)}>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl max-w-lg w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-2 dark:text-white">Выберите вариант для примерки</h3>
                  <p className="text-gray-500 text-sm mb-6">Какую именно вещь (цвет) вы хотите примерить?</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {aiVariants.map((img, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => handleVariantSelect(img)} 
                            className="relative aspect-[3/4] border-2 border-transparent hover:border-pink-500 rounded-xl overflow-hidden transition-all hover:scale-105 group bg-gray-50"
                          >
                              <ClientImage src={img} alt={`Variant ${idx}`} fill className="object-contain p-2" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setShowVariantSelector(false)} className="mt-6 text-gray-400 hover:text-gray-600 dark:hover:text-white underline text-sm transition-colors">
                    Отмена
                  </button>
              </div>
          </div>
      )}

      <div className="container mx-auto px-4 py-8 relative">
        <Link href="/catalog" className="inline-flex items-center text-gray-500 hover:text-dark-teal mb-6 transition-colors">
          <Icon name="arrow-left" className="w-4 h-4 mr-2" />
          Назад в каталог
        </Link>

        <div className="bg-white dark:bg-[#153030] rounded-3xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
<<<<<<< HEAD
            
            {/* --- ЛЕВАЯ КОЛОНКА: ФОТО + МИНИАТЮРЫ --- */}
            <div className="flex flex-col h-full bg-gray-50 dark:bg-black/20">
                {/* 1. ГЛАВНОЕ ФОТО */}
                <div className="relative h-[50vh] md:h-[600px] w-full group overflow-hidden">
                    <div 
                        className="w-full h-full relative cursor-zoom-in"
                        onClick={() => setIsFullScreen(true)}
                        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                    >
                        <ClientImage 
                            src={images[currentImageIndex]} 
                            alt={product.name} 
                            fill 
                            className="object-contain md:object-cover transition-transform duration-700 group-hover:scale-105" 
                            priority
                        />
                        
                        {/* Бейджик AI */}
                        {aiVariants.length > 0 && (
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-pink-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                                ✨ AI Ready {aiVariants.length > 1 && `(${aiVariants.length})`}
                            </div>
                        )}
                    </div>
                    
                    {/* Стрелки навигации (только если > 1 фото) */}
                    {images.length > 1 && (
                        <>
                        <button onClick={(e) => {e.stopPropagation(); setCurrentImageIndex(p => p===0?images.length-1:p-1)}} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"><Icon name="arrow-left" className="w-5 h-5"/></button>
                        <button onClick={(e) => {e.stopPropagation(); setCurrentImageIndex(p => p===images.length-1?0:p+1)}} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"><Icon name="arrow-right" className="w-5 h-5"/></button>
                        
                        {/* Точки для мобильных */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:hidden z-20">
                            {images.map((_, idx) => (
                            <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-primary-pink w-6' : 'bg-white/50'}`} />
                            ))}
                        </div>
                        </>
                    )}
                </div>

                {/* 2. 🔥 ПРОФЕССИОНАЛЬНЫЕ МИНИАТЮРЫ (ТОЛЬКО ДЕСКТОП И ПЛАНШЕТ) */}
                {images.length > 1 && (
                    <div className="hidden md:flex gap-3 p-4 overflow-x-auto justify-center bg-white dark:bg-[#1a3d3d] border-t border-gray-100 dark:border-white/5">
                        {images.map((img, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0
                                    ${idx === currentImageIndex 
                                        ? 'border-primary-pink scale-105 shadow-md' 
                                        : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'}`}
                            >
                                <ClientImage src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* --- ПРАВАЯ КОЛОНКА: ИНФО --- */}
=======
            {/* ФОТО */}
            <div className="relative bg-gray-100 dark:bg-black/20 h-[50vh] md:h-auto group">
               <div 
                 className="w-full h-full relative cursor-zoom-in"
                 onClick={() => setIsFullScreen(true)}
                 onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
               >
                 <ClientImage 
                   src={images[currentImageIndex]} 
                   alt={product.name} 
                   fill 
                   className="object-contain md:object-cover transition-transform duration-700 group-hover:scale-105" 
                   priority
                 />
                 {/* 🔥 БЕЙДЖИК, ЕСЛИ ЕСТЬ AI ФОТО */}
                 {product.tryOnImage && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-pink-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        ✨ AI Ready
                    </div>
                 )}
               </div>
               
               {images.length > 1 && (
                 <>
                   <button onClick={(e) => {e.stopPropagation(); setCurrentImageIndex(p => p===0?images.length-1:p-1)}} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><Icon name="arrow-left" className="w-5 h-5"/></button>
                   <button onClick={(e) => {e.stopPropagation(); setCurrentImageIndex(p => p===images.length-1?0:p+1)}} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><Icon name="arrow-right" className="w-5 h-5"/></button>
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                     {images.map((_, idx) => (
                       <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-primary-pink w-6' : 'bg-white/50'}`} />
                     ))}
                   </div>
                 </>
               )}
            </div>

            {/* ИНФО */}
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <div className="mb-2 flex items-center gap-2">
                 <span className="bg-primary-pink/20 text-dark-teal dark:text-primary-pink px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">New Collection</span>
                 {isAdded && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">Товар в корзине</span>}
              </div>

              <h1 className="text-3xl md:text-5xl font-serif font-bold text-dark-teal dark:text-white mb-4 leading-tight">{product.name}</h1>
              <div className="flex items-end gap-4 mb-8">
                <p className="text-4xl font-bold text-accent-rose">{product.price} <span className="text-lg text-gray-400">TJS</span></p>
              </div>

              <div className="prose dark:prose-invert max-w-none mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>{product.description}</p>
              </div>

              {availableSizes.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Выберите размер</p>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)} className={`w-12 h-12 rounded-xl font-bold border-2 transition-all flex items-center justify-center ${selectedSize === size ? 'bg-dark-teal text-white border-dark-teal shadow-lg scale-110' : 'border-gray-200 text-gray-500 hover:border-primary-pink dark:border-gray-700 dark:text-gray-400'}`}>{size}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <button onClick={handleAddToCart} className="flex-1 py-4 bg-dark-teal text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center justify-center gap-2">
                    <Icon name="bag" className="w-5 h-5" /> В корзину
                  </button>
                  <button onClick={() => handleAuthAction(() => toggleFavorite(product._id))} className={`p-4 rounded-2xl border-2 transition-all ${liked ? 'border-accent-rose bg-accent-rose/10 text-accent-rose' : 'border-gray-200 text-gray-400 hover:border-accent-rose'}`}>
                    <Icon name="heart" className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                  </button>
                </div>

<<<<<<< HEAD
                {/* 🔥 КНОПКА ПРИМЕРКИ С НОВОЙ ЛОГИКОЙ */}
                <button onClick={handleTryOnClick} className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-primary-pink shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group">
=======
                {/* 🔥 ОБНОВЛЕННАЯ КНОПКА ПРИМЕРКИ */}
                <button onClick={handleOpenTryOn} className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-primary-pink shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group">
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
                  <span className="text-xl group-hover:rotate-12 transition-transform">✨</span>
                  Примерить онлайн (AI)
                </button>
                
                <button onClick={handleBuyNow} className="w-full py-3 text-sm font-bold text-gray-400 hover:text-dark-teal dark:hover:text-white transition-colors underline">Купить в 1 клик</button>
              </div>
            </div>
          </div>
          
          <div className="p-6 md:p-10 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
             <h3 className="text-2xl font-serif font-bold text-dark-teal dark:text-white mb-6">Отзывы ({reviews.length})</h3>
             <div className="grid md:grid-cols-2 gap-8">
               <form onSubmit={handleReviewSubmit} className="bg-white dark:bg-[#1a3d3d] p-6 rounded-2xl shadow-sm">
                 <h4 className="font-bold mb-4 dark:text-white">Оставить отзыв</h4>
                 <input value={userName} onChange={e=>setUserName(e.target.value)} placeholder="Ваше имя" className="w-full p-3 mb-3 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none dark:text-white" />
                 <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Ваше мнение..." className="w-full p-3 mb-3 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none h-24 resize-none dark:text-white" />
                 <div className="flex justify-between items-center">
                   <select value={rating} onChange={e=>setRating(e.target.value)} className="bg-transparent font-bold text-yellow-500 outline-none cursor-pointer">{[5,4,3,2,1].map(r=><option key={r} value={r}>{r} ★</option>)}</select>
                   <button type="submit" className="px-6 py-2 bg-dark-teal text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition">Отправить</button>
                 </div>
                 {reviewSuccess && <p className="text-green-500 text-sm mt-2">{reviewSuccess}</p>}
                 {reviewError && <p className="text-red-500 text-sm mt-2">{reviewError}</p>}
               </form>
               <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                 {reviews.length > 0 ? reviews.map(r => (
                   <div key={r._id} className="bg-white dark:bg-[#1a3d3d] p-4 rounded-xl shadow-sm">
                     <div className="flex justify-between"><span className="font-bold dark:text-white">{r.userName}</span><span className="text-yellow-500">{'★'.repeat(r.rating)}</span></div>
                     <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{r.comment}</p>
                     <p className="text-xs text-gray-400 mt-2">{formatDate(r.createdAt)}</p>
                   </div>
                 )) : <p className="text-gray-500">Отзывов пока нет.</p>}
               </div>
             </div>
          </div>
        </div>

        {similarProducts?.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-serif font-bold mb-8 text-center text-dark-teal dark:text-white">Вам может понравиться</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{similarProducts.map(p => <ProductCard key={p._id} product={p} />)}</div>
            </div>
        )}
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center" onClick={() => setIsFullScreen(false)}>
           <button onClick={() => setIsFullScreen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition z-[101]"><Icon name="close" className="w-10 h-10" /></button>
           <div className="relative w-full h-full max-w-5xl max-h-[90vh] p-4 flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <ClientImage src={images[currentImageIndex]} alt={product.name} fill className="object-contain" />
           </div>
        </div>
      )}
      
<<<<<<< HEAD
      {/* 🔥 Передаем конкретное выбранное изображение в модалку */}
      <TryOnModal 
        isOpen={isTryOnOpen} 
        onClose={() => setIsTryOnOpen(false)} 
        garmentImage={selectedTryOnImage} 
=======
      {/* 🔥 ОБНОВЛЕННЫЙ ВЫЗОВ МОДАЛКИ: Передаем категорию и спец. фото */}
      <TryOnModal 
        isOpen={isTryOnOpen} 
        onClose={() => setIsTryOnOpen(false)} 
        // 1. Приоритет: tryOnImage -> imageLarge -> image
        garmentImage={product.tryOnImage || product.imageLarge || product.image} 
        // 2. Категория для нейросети
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
        garmentCategory={product.aiCategory || 'upper_body'}
      />
    </div>
  );
}
