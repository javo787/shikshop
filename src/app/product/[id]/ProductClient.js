'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '../../../components/ProductCard';

// Кастомная функция форматирования даты (без date-fns)
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
};

export default function ProductClient({ product, similarProducts, reviews }) {
  const [error, setError] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const modalRef = useRef(null);

  // Таймаут для долгой загрузки
  useEffect(() => {
    if (!product) {
      const timer = setTimeout(() => {
        setError('Загрузка занимает слишком много времени. Попробуйте обновить страницу.');
      }, 10000); // 10 сек
      return () => clearTimeout(timer);
    }
  }, [product]);

  // useMemo для изображений и bullet points
  const images = useMemo(() => {
  const imgList = [
    ...(product?.imageLarge ? [product.imageLarge] : []),
    ...(product?.image && !product.imageLarge ? [product.image] : []),
    ...(product?.additionalImages || []),
  ];
  console.log('Images array:', imgList, 'Length:', imgList.length); // Отладка: покажет в console сколько фото
  return imgList;
}, [product]);

  const descriptionBullets = useMemo(() => 
    product?.description ? product.description.split('. ').filter(d => d.trim()) : [],
  [product]);

  const handleThumbnailClick = (index) => {
    setImageLoaded(false);
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
    if (e.key === 'Escape') {
      handleCloseFullScreen();
    } else if (e.key === 'ArrowLeft') {
      handlePrevImage();
    } else if (e.key === 'ArrowRight') {
      handleNextImage();
    }
  };

  useEffect(() => {
    if (isFullScreen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, images.length]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) {
      setReviewError('Имя и комментарий не могут быть пустыми');
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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
      setReviewSuccess('Отзыв успешно добавлен');
      setReviewError(null);
      setUserName('');
      setRating(5);
      setComment('');
    } catch (err) {
      console.error('Error submitting review:', err.message);
      setReviewError(err.message);
      setReviewSuccess(null);
    }
  };

  const handleBuyClick = () => {
    if (!product) return;
    const message = encodeURIComponent(
      `Ассаляму алейкум, я хочу купить этот товар: ${product.name}, цена: ${product.price} ₽, ID: ${product._id}`
    );
    const whatsappUrl = `https://wa.me/+992929682777?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!product) return <div className="text-center">Загрузка...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-text-dark mb-6">{product.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Галерея изображений */}
        <div className="relative">
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-10"
                aria-label="Предыдущее изображение"
              >
                ←
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-10"
                aria-label="Следующее изображение"
              >
                →
              </button>
            </>
          )}
          <div className="cursor-pointer" onClick={handleImageClick}>
            <Image
              src={images[currentImageIndex] || '/placeholder.jpg'}
              alt={product.name}
              width={500}
              height={500}
              style={{ width: 'auto', height: 'auto' }}
              className={`object-contain w-full h-auto max-h-[500px] fade-image ${imageLoaded ? 'loaded' : ''}`}
              onLoad={() => setImageLoaded(true)}
              priority={true}
            />
          </div>
          {images.length > 1 && (
            <div className="thumbnail-container mt-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleThumbnailClick(index);
                    }
                  }}
                  className="flex-shrink-0"
                >
                  <Image
                    src={img}
                    alt={`${product.name} - изображение ${index + 1}`}
                    width={80}
                    height={80}
                    style={{ width: '80px', height: '80px' }}
                    className={`object-cover cursor-pointer rounded border-2 ${
                      index === currentImageIndex
                        ? 'border-accent-rose opacity-100'
                        : 'border-gray-300 opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => handleThumbnailClick(index)}
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Информация о товаре */}
        <div>
          <p className="text-lg text-text-gray mb-4">{product.description}</p>
          <p className="text-2xl font-bold text-text-dark mb-4">{product.price} ₽</p>
          {product.stock > 0 && (
            <span className="inline-block bg-accent-mint text-text-dark px-3 py-1 rounded-full text-sm font-semibold mb-4">
              В наличии ({product.stock} шт.)
            </span>
          )}
          {(product.sizes || product.material || product.details || product.color) && (
            <div className="mb-4">
              <h3 className="font-semibold text-text-dark mb-2">Характеристики:</h3>
              <ul className="space-y-1 text-text-gray">
                {product.sizes && <li>• Размер: {product.sizes}</li>}
                {product.material && <li>• Материал: {product.material}</li>}
                {product.color && <li>• Цвет: {product.color}</li>}
                {product.details && <li>• Детали: {product.details}</li>}
              </ul>
            </div>
          )}
          {descriptionBullets.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-text-dark mb-2">Описание:</h3>
              <ul className="space-y-1 text-text-gray">
                {descriptionBullets.map((bullet, index) => (
                  <li key={index}>• {bullet}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {/* Кнопки "Купить" и "Помощь" */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-lg p-4 flex justify-center gap-4 z-50">
        <button
          onClick={handleBuyClick}
          className="bg-accent-rose text-text-light px-4 py-2 rounded-lg hover:bg-primary-pink hover:scale-105 transition-all duration-200 sm:px-6 sm:py-3"
        >
          Купить
        </button>
        <Link
          href="/contacts"
          className="bg-neutral-gray text-text-dark px-4 py-2 rounded-lg hover:bg-primary-pink hover:text-text-light hover:scale-105 transition-all duration-200 sm:px-6 sm:py-3"
        >
          Помощь
        </Link>
      </div>
      {/* Отзывы */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-text-dark mb-4">Отзывы</h2>
        <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 mb-8 max-w-md">
          <input
            type="text"
            placeholder="Ваше имя"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="p-2 border rounded"
            required
          />
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="p-2 border rounded"
          >
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                {r} звёзд
              </option>
            ))}
          </select>
          <textarea
            placeholder="Ваш отзыв"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="p-2 border rounded h-24"
            required
          />
          <button type="submit" className="bg-accent-rose text-text-light px-4 py-2 rounded">
            Отправить отзыв
          </button>
          {reviewError && <p className="text-red-500">{reviewError}</p>}
          {reviewSuccess && <p className="text-green-500">{reviewSuccess}</p>}
        </form>
        <div className="grid grid-cols-1 gap-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review._id || review.createdAt} className="p-4 border rounded">
                <p><strong>{review.userName}</strong> ({review.rating} звёзд)</p>
                <p className="text-text-gray">{review.comment}</p>
                <p className="text-sm text-text-gray">
                  {formatDate(review.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-text-gray">Отзывов пока нет</p>
          )}
        </div>
      </div>
      {/* Похожие товары */}
      {similarProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-text-dark mb-4">Похожие товары</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {similarProducts.map((similarProduct) => (
              <ProductCard key={similarProduct._id} product={similarProduct} loading="lazy" />
            ))}
          </div>
        </div>
      )}
      {/* Полноэкранный режим */}
      {isFullScreen && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          tabIndex={-1}
        >
          <button
            onClick={handleCloseFullScreen}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            aria-label="Закрыть"
          >
            ×
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 text-white text-3xl hover:text-gray-300 z-10"
              >
                ←
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 text-white text-3xl hover:text-gray-300 z-10"
              >
                →
              </button>
            </>
          )}
          <Image
            src={images[currentImageIndex]}
            alt={product.name}
            width={800}
            height={800}
            style={{ width: 'auto', height: 'auto' }}
            className="max-w-full max-h-full object-contain cursor-zoom-in"
          />
        </div>
      )}
    </div>
  );
}