'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import ClientImage from './ClientImage';
import { auth } from '@/lib/firebase'; // Импортируем Auth

// --- КОНСТАНТЫ ---
// Разрешаем выбирать большие файлы (до 30МБ), так как мы их все равно сожмем
const MAX_INPUT_SIZE_MB = 30; 
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const LOGO_PATH = '/images/logo.png'; 

const COMPLIMENTS = [
  "Вау! Вы выглядите потрясающе! 😍",
  "Этот образ создан для вас! ✨",
  "Просто икона стиля! 💖",
  "Вам очень идет! 🔥",
  "10 из 10! Идеальное сочетание! 🌟"
];

export default function TryOnModal({ isOpen, onClose, garmentImage }) {
  // Основные состояния
  const [personImage, setPersonImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [step, setStep] = useState('upload'); 
  const [compliment, setCompliment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Состояния для лимитов и пользователя
  const [user, setUser] = useState(null);
  const [remainingTries, setRemainingTries] = useState(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });

    if (!isOpen) {
      setTimeout(() => {
        setPersonImage(null);
        setGeneratedImage(null);
        setStep('upload');
        setError(null);
        setWarning(null);
        setLoading(false);
        setIsDragging(false);
        setIsLimitReached(false);
      }, 300);
    }
    return () => unsubscribe();
  }, [isOpen]);

  // --- ФУНКЦИЯ СЖАТИЯ ИЗОБРАЖЕНИЯ ---
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Максимальная сторона - 1280px (достаточно для качественной примерки)
          const MAX_SIZE = 1280; 
          let width = img.width;
          let height = img.height;

          // Логика ресайза с сохранением пропорций
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Сжимаем в JPEG с качеством 0.8 (значительно уменьшает вес)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const applyBranding = async (imageUrl) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const logo = new window.Image();
        logo.src = LOGO_PATH;
        logo.onload = () => {
          const logoWidth = canvas.width * 0.20; 
          const logoHeight = logo.height * (logoWidth / logo.width);
          const padding = canvas.width * 0.05;
          ctx.globalAlpha = 0.9;
          ctx.drawImage(logo, canvas.width - logoWidth - padding, padding, logoWidth, logoHeight);
          const brandedUrl = canvas.toDataURL('image/png');
          resolve(brandedUrl);
        };
        logo.onerror = () => resolve(imageUrl);
      };
      img.onerror = () => resolve(imageUrl);
    });
  };

  // --- ОБРАБОТКА ФАЙЛА С АВТО-СЖАТИЕМ ---
  const processFile = async (file) => {
    setError(null);
    if (!file) return;
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Поддерживаются только форматы JPG, PNG и WEBP.');
      return;
    }

    // Проверяем входной размер (на всякий случай, чтобы браузер не завис от 100МБ файла)
    if (file.size > MAX_INPUT_SIZE_MB * 1024 * 1024) {
      setError(`Файл слишком большой. Максимум ${MAX_INPUT_SIZE_MB} МБ.`);
      return;
    }

    try {
        // Если файл больше 2МБ, сжимаем его. Если меньше - оставляем как есть или тоже нормализуем.
        // Лучше прогонять через сжатие всегда, чтобы гарантировать формат и размер для API.
        const compressedImage = await compressImage(file);
        setPersonImage(compressedImage);
    } catch (err) {
        console.error("Ошибка сжатия:", err);
        setError("Не удалось обработать изображение. Попробуйте другое.");
    }
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  
  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault(); 
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) return;

    setLoading(true);
    setError(null);
    setWarning(null);
    setIsLimitReached(false);
    setStep('processing');

    try {
      const startResponse = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personImage, 
          garmentImage,
          userId: user?.uid || null 
        }),
      });

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        if (startData.error === 'LIMIT_REACHED_GUEST') {
          setError('Гостевой лимит исчерпан! Зарегистрируйтесь, чтобы получить 3 попытки.');
          setIsLimitReached(true);
          setStep('upload'); 
          setLoading(false);
          return;
        } 
        if (startData.error === 'LIMIT_REACHED_BUY') {
          setError('Лимит исчерпан! Оформите заказ, чтобы получить 30 попыток.');
          setIsLimitReached(true);
          setStep('upload');
          setLoading(false);
          return;
        }
        throw new Error(startData.error || "Ошибка запуска");
      }

      let prediction = startData;
      
      if (prediction.warning) setWarning(prediction.warning);

      while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const checkResponse = await fetch(`/api/try-on?id=${prediction.id}`);
        if (checkResponse.ok) {
           prediction = await checkResponse.json();
        }
      }

      if (prediction.status === 'failed') {
        throw new Error("Нейросеть не справилась с фото. Попробуйте другое, более четкое фото.");
      }

      let finalUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      const brandedImage = await applyBranding(finalUrl);

      if (prediction.remaining !== undefined) {
        setRemainingTries(prediction.remaining);
      }

      setCompliment(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
      setGeneratedImage(brandedImage);
      setStep('result');

    } catch (err) {
      setError(err.message || 'Произошла ошибка. Попробуйте другое фото.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

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
    setWarning(null);
    setPersonImage(null);
    setIsLimitReached(false);
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
      <p className="text-gray-500 max-w-xs mx-auto">Примерка займет около 30 секунд. Пожалуйста, не закрывайте окно.</p>
    </div>
  );

  const renderResult = () => (
    <div className="flex flex-col items-center animate-slideUp">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2 drop-shadow-sm">{compliment}</h2>
        <p className="text-gray-500 text-sm">Готово! Образ сохранен в высоком качестве.</p>
        
        {remainingTries !== null && (
          <p className="text-xs text-gray-400 mt-1">Осталось попыток: <b>{remainingTries}</b></p>
        )}
      </div>

      {warning && (
        <div className="w-full max-w-md mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-xl text-sm flex items-start gap-3 shadow-sm">
          <span className="text-xl">⚠️</span>
          <span>{warning}</span>
        </div>
      )}

      <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl mb-8 group ring-4 ring-pink-50 dark:ring-gray-800 bg-gray-100">
        <img src={generatedImage} alt="Результат" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"/>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button onClick={handleDownload} className="flex-1 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group active:scale-95">
          <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Скачать фото
        </button>
        <button onClick={reset} className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 active:scale-95">Ещё раз</button>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-full">
      <div className="flex flex-col gap-4 group h-full">
        <p className="font-bold text-gray-700 dark:text-white flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">1</span> Ваше фото</p>
        
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex gap-2 items-start">
            <span className="text-lg">ℹ️</span>
            <div>
              {!user ? (
                 <>Вы <b>Гость</b> (1 попытка). <a href="/register" className="underline font-bold hover:text-blue-500">Войдите</a>, чтобы получить 3.</>
              ) : (
                 <>У вас есть <b>лимитированные</b> попытки. Купите любой товар, чтобы получить 30!</>
              )}
            </div>
        </div>

        <div className={`flex-1 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-4 min-h-[250px] relative overflow-hidden ${isDragging ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 scale-[1.02]' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-pink-400 hover:bg-white'}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => !personImage && fileInputRef.current?.click()}>
          {personImage ? (
            <>
              <Image src={personImage} alt="Вы" fill className="object-cover rounded-xl" unoptimized />
              <button onClick={(e) => { e.stopPropagation(); setPersonImage(null); setIsLimitReached(false); }} className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2.5 shadow-lg text-red-500 hover:bg-red-50 hover:scale-110 transition-all z-10"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </>
          ) : (
            <div className="text-center p-6 transition-transform group-hover:scale-105 pointer-events-none">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl transition-colors ${isDragging ? 'bg-pink-200 text-pink-600' : 'bg-pink-100 text-pink-500'}`}>{isDragging ? '📂' : '📸'}</div>
              <span className="font-bold text-lg text-gray-700 dark:text-gray-200 block mb-1">{isDragging ? 'Отпускайте!' : 'Загрузить фото'}</span>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={ALLOWED_TYPES.join(',')} className="hidden" />
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <h5 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-2 flex items-center gap-2">💡 Советы:</h5>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 list-disc pl-4">
             <li>📸 Используйте фото в полный рост</li>
             <li>👗 Лучше работает с облегающей одеждой</li>
             <li>💡 Избегайте темных фото</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-4 h-full">
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
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] z-10 border border-white/40 dark:border-gray-700">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3"><span className="text-2xl">✨</span> Виртуальная примерочная</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200">&times;</button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {step === 'processing' && renderProcessing()}
          {step === 'result' && generatedImage && renderResult()}
          {step === 'upload' && renderUpload()}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex flex-col items-center gap-2 animate-shake shadow-sm">
              <span className="font-medium text-center">{error}</span>
              {/* Если лимит исчерпан, показываем кнопку регистрации/покупки */}
              {isLimitReached && (
                 !user ? (
                   <a href="/register" className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Зарегистрироваться</a>
                 ) : (
                   <button onClick={onClose} className="text-sm bg-dark-teal text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition">Вернуться к покупкам</button>
                 )
              )}
            </div>
          )}
        </div>
        {step === 'upload' &&    <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:text-gray-800 font-medium transition-colors rounded-xl hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-700">Отмена</button>
            <button 
              onClick={handleTryOn} 
              disabled={!personImage || loading || isLimitReached} 
              className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all transform flex items-center gap-2 
                ${personImage && !loading && !isLimitReached 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-pink-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none' 
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-70'}`}
            >
              {loading ? <>Обработка...</> : <>✨ Примерить</>}
            </button>
          </div>
       )}
      </div>
    </div>
  );
}