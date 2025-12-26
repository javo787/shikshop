'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ClientImage from '../../../components/ClientImage';
import Link from 'next/link';
import ProductCard from '../../../components/ProductCard';

// Простая функция форматирования даты
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}`;
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
  const modalRef = useRef(null);

  // Состояния для примерки
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  // Массив изображений (Cloudinary или старый путь)
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

  // Функции для примерки
  const handleTryOn = () => {
    setShowTryOnModal(true);
    setGeneratedImage(null);
  };

  const handleUserPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setGenerating(true);
    setGeneratedImage(null);

    // Загружаем фото пользователя в Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'shikshop_unsigned');

    try {
      const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dprydst2c/image/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Ошибка загрузки фото');
      const uploadData = await uploadRes.json();
      const personUrl = uploadData.secure_url;

      // Отправляем на наш API
      const aiRes = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage: personUrl,
          garmentImage: images[0] || product.image, // Главное фото одежды
        }),
      });

      if (!aiRes.ok) throw new Error('Ошибка AI-примерки');
      const { image } = await aiRes.json();
      setGeneratedImage(image);
    } catch (err) {
      console.error(err);
      alert('Не удалось сгенерировать примерку. Попробуйте позже.');
    } finally {
      setGenerating(false);
    }
  };

  if (!product) {
    return <div className="text-center py-20">Товар не найден</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Галерея */}
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

          {/* Кнопка примерки */}
          <div className="mt-6 text-center">
            <button
              onClick={handleTryOn}
              className="bg-accent-rose text-white px-8 py-3 rounded-lg hover:bg-primary-pink transition text-lg"
            >
              ✨ Примерить онлайн
            </button>
          </div>
        </div>

        {/* Информация */}
        <div>
          <h1 className="text-3xl font-bold text-text-dark mb-4">{product.name}</h1>
          <p className="text-2xl font-semibold text-accent-rose mb-6">
            {product.price ? `${product.price} TJS` : 'Цена по запросу'}
          </p>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Описание</h3>
            <ul className="list-disc pl-5 space-y-2">
              {product.description.split('. ').filter(Boolean).map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>

          {product.material && <p><strong>Материал:</strong> {product.material}</p>}
          {product.sizes && <p><strong>Размеры:</strong> {product.sizes}</p>}
          {product.details && <p><strong>Детали:</strong> {product.details}</p>}

          {/* Отзывы */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Отзывы</h2>
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
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
              <textarea
                placeholder="Ваш отзыв"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="p-2 border rounded h-24"
                required
              />
              <button type="submit" className="bg-accent-rose text-white px-4 py-2 rounded">
                Отправить
              </button>
              {reviewError && <p className="text-red-500">{reviewError}</p>}
              {reviewSuccess && <p className="text-green-500">{reviewSuccess}</p>}
            </form>

            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map(r => (
                  <div key={r._id} className="p-4 border rounded">
                    <p><strong>{r.userName}</strong> ({r.rating} ★)</p>
                    <p>{r.comment}</p>
                    <p className="text-sm text-gray-500">{formatDate(r.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Отзывов пока нет</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Похожие товары */}
      {similarProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Похожие товары</h2>
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
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          tabIndex={-1}
        >
          <button
            onClick={handleCloseFullScreen}
            className="absolute top-4 right-4 text-white text-4xl"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button onClick={handlePrevImage} className="absolute left-4 text-white text-4xl">←</button>
              <button onClick={handleNextImage} className="absolute right-4 text-white text-4xl">→</button>
            </>
          )}

          <ClientImage
            src={images[currentImageIndex]}
            alt={product.name}
            width={1200}
            height={1200}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}

      {/* Модальное окно примерки */}
      {showTryOnModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-lg w-full relative">
            <button
              onClick={() => setShowTryOnModal(false)}
              className="absolute top-2 right-4 text-2xl font-bold"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">Примерить онлайн</h2>
            <p className="mb-4 text-center">Загрузите своё фото (лучше в полный рост)</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleUserPhotoUpload}
              className="block mx-auto mb-4"
            />
            {generating && <p className="text-center text-blue-600">Генерация... (30–60 сек)</p>}
            {generatedImage && (
              <div className="mt-4">
                <img src={generatedImage} alt="Результат примерки" className="w-full rounded shadow" />
                <p className="text-sm text-gray-500 text-center mt-2">Powered by PARIZOD AI</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}