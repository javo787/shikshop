'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import ClientImage from './ClientImage';

// --- КОНСТАНТЫ ---
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const LOGO_PATH = '/images/logo.png'; // 👈 Убедись, что лого лежит тут

const COMPLIMENTS = [
  "Вау! Вы выглядите потрясающе! 😍",
  "Этот образ создан для вас! ✨",
  "Просто икона стиля! 💖",
  "Вам очень идет! 🔥",
  "10 из 10! Идеальное сочетание! 🌟"
];

export default function TryOnModal({ isOpen, onClose, garmentImage }) {
  const [personImage, setPersonImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); 
  const [compliment, setCompliment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setPersonImage(null);
        setGeneratedImage(null);
        setStep('upload');
        setError(null);
        setLoading(false);
        setIsDragging(false);
      }, 300);
    }
  }, [isOpen]);

  // --- ФУНКЦИЯ НАЛОЖЕНИЯ ЛОГОТИПА ---
  const applyBranding = async (imageUrl) => {
    return new Promise((resolve) => {
      const img = new window.Image(); // Используем нативный Image браузера
      img.crossOrigin = "Anonymous";  // Важно для картинок с Replicate
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 1. Устанавливаем размер холста как у картинки
        canvas.width = img.width;
        canvas.height = img.height;

        // 2. Рисуем фото от AI
        ctx.drawImage(img, 0, 0);

        // 3. Загружаем и рисуем Логотип
        const logo = new window.Image();
        logo.src = LOGO_PATH;
        
        logo.onload = () => {
          // Настраиваем размер лого (например, 20% от ширины фото)
          const logoWidth = canvas.width * 0.20; 
          const logoHeight = logo.height * (logoWidth / logo.width); // Сохраняем пропорции
          
          // Отступы (padding)
          const padding = canvas.width * 0.05;

          // Координаты: Верхний Правый угол
          const x = canvas.width - logoWidth - padding;
          const y = padding;

          // Рисуем лого
          ctx.globalAlpha = 0.9; // Немного прозрачности (опционально)
          ctx.drawImage(logo, x, y, logoWidth, logoHeight);
          
          // Возвращаем готовую картинку Base64
          resolve(canvas.toDataURL('image/png'));
        };

        // Если лого не нашлось - возвращаем просто картинку
        logo.onerror = () => {
          console.warn("Логотип не найден, возвращаем оригинал");
          resolve(imageUrl);
        };
      };

      img.onerror = () => {
        console.error("Ошибка загрузки изображения для брендинга");
        resolve(imageUrl);
      };
    });
  };

  // --- ОБРАБОТКА ФАЙЛОВ ---
  const processFile = (file) => {
    setError(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Поддерживаются только форматы JPG, PNG и WEBP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Файл слишком большой. Максимум ${MAX_FILE_SIZE_MB} МБ.`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPersonImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  // --- ПРИМЕРКА ---
  const handleTryOn = async () => {
    if (!personImage || !garmentImage) return;

    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage: personImage,
          garmentImage: garmentImage,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка генерации');

      // 🔥 МАГИЯ ЗДЕСЬ: Накладываем логотип перед показом
      const brandedImage = await applyBranding(data.resultImage);

      setCompliment(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
      setGeneratedImage(brandedImage); // Сохраняем уже с логотипом!
      setStep('result');

    } catch (err) {
      console.error(err);
      setError(err.message || 'Произошла ошибка. Попробуйте другое фото.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // Скачивание (теперь скачивает версию С ЛОГОТИПОМ)
  const handleDownload = async () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `parizod-premium-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setGeneratedImage(null);
    setStep('upload');
    setError(null);
    setPersonImage(null);
  };

  if (!isOpen) return null;

  // --- RENDER ---
  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center h-[400px] text-center animate-fadeIn">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">✨</div>
      </div>
      <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Создаем магию...</h4>
      <p className="text-gray-500 max-w-xs mx-auto">Нейросеть примеряет наряд и добавляет фирменный стиль.</p>
    </div>
  );

  const renderResult = () => (
    <div className="flex flex-col items-center animate-slideUp">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2 drop-shadow-sm">
          {compliment}
        </h2>
        <p className="text-gray-500 text-sm">Готово! Образ сохранен в высоком качестве.</p>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl mb-8 group ring-4 ring-pink-50 dark:ring-gray-800 bg-gray-100">
        <img 
          src={generatedImage} 
          alt="Результат примерки" 
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button onClick={handleDownload} className="flex-1 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group active:scale-95">
          <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Скачать фото
        </button>
        <button onClick={reset} className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 active:scale-95">
          Ещё раз
        </button>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-full">
      <div className="flex flex-col gap-4 group">
        <p className="font-bold text-gray-700 dark:text-white flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">1</span> Ваше фото</p>
        <div 
          className={`flex-1 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-4 min-h-[300px] relative overflow-hidden ${isDragging ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 scale-[1.02]' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-pink-400 hover:bg-white'}`}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => !personImage && fileInputRef.current?.click()}
        >
          {personImage ? (
            <>
              <Image src={personImage} alt="Вы" fill className="object-cover rounded-xl" unoptimized />
              <button onClick={(e) => { e.stopPropagation(); setPersonImage(null); }} className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2.5 shadow-lg text-red-500 hover:bg-red-50 hover:scale-110 transition-all z-10"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </>
          ) : (
            <div className="text-center p-6 transition-transform group-hover:scale-105 pointer-events-none">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl transition-colors ${isDragging ? 'bg-pink-200 text-pink-600' : 'bg-pink-100 text-pink-500'}`}>{isDragging ? '📂' : '📸'}</div>
              <span className="font-bold text-lg text-gray-700 dark:text-gray-200 block mb-1">{isDragging ? 'Отпускайте!' : 'Загрузить фото'}</span>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={ALLOWED_TYPES.join(',')} className="hidden" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <p className="font-bold text-gray-700 dark:text-white flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">2</span> Одежда</p>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center p-4 min-h-[300px] relative shadow-inner">
          {garmentImage ? (<ClientImage src={garmentImage} alt="Одежда" fill className="object-contain p-4 transition-transform hover:scale-110 duration-500" />) : (<div className="flex flex-col items-center text-gray-400"><p>Нет фото</p></div>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-white/40 dark:border-gray-700">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3"><span className="text-2xl">✨</span> Виртуальная примерочная</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200">&times;</button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {step === 'processing' && renderProcessing()}
          {step === 'result' && generatedImage && renderResult()}
          {step === 'upload' && renderUpload()}
          {error && (<div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 animate-shake shadow-sm"><span className="font-medium">{error}</span></div>)}
        </div>
        {step === 'upload' && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:text-gray-800 font-medium transition-colors rounded-xl hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-700">Отмена</button>
            <button onClick={handleTryOn} disabled={!personImage || loading} className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all transform flex items-center gap-2 ${personImage && !loading ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-pink-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-70'}`}>
              {loading ? <>Обработка...</> : <>✨ Примерить</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}