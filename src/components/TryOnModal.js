'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import ClientImage from './ClientImage';
import { auth } from '@/lib/firebase';

// --- КОНСТАНТЫ ---
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

const VALIDATION_CHECKLIST = [
  { id: 'light', label: 'Свет яркий, лицо и тело четко видно, без резких теней.' },
  { id: 'pose', label: 'Я стою ровно, смотрю прямо, руки немного в стороны (не скрещены).' },
  { id: 'clothes', label: 'На мне облегающая одежда (не оверсайз, не пуховик).' },
];

// --- КРАСИВЫЕ СТАТУСЫ ЗАГРУЗКИ ---
const LOADING_STEPS = [
  { text: "🔍 Сканируем ваше фото...", emoji: "📸" },
  { text: "📐 Строим 3D-модель фигуры...", emoji: "👤" },
  { text: "✂️ Подгоняем лекала одежды...", emoji: "👗" },
  { text: "🧵 Виртуальный пошив...", emoji: "🪡" },
  { text: "🎨 Накладываем текстуры ткани...", emoji: "🧶" },
  { text: "💡 Выставляем студийный свет...", emoji: "💡" },
  { text: "🖌️ Прорисовываем складки и тени...", emoji: "🖊️" },
  { text: "✨ Добавляем реалистичность...", emoji: "✨" },
  { text: "🤖 Нейросеть старается для вас...", emoji: "🤖" },
  { text: "📸 Финальная обработка кадра...", emoji: "🖼️" },
  { text: "💅 Наводим последний лоск...", emoji: "💖" },
  { text: "🚀 Почти готово, загружаем...", emoji: "🚀" }
];

// --- НОВЫЙ КОМПОНЕНТ: Модальное окно валидации фото ---
function PhotoValidationModal({ isOpen, onClose, onConfirm, imageSrc, brightnessWarning }) {
  const [checkedItems, setCheckedItems] = useState({});
  const allChecked = VALIDATION_CHECKLIST.every(item => checkedItems[item.id]);

  useEffect(() => {
    if (isOpen) setCheckedItems({});
  }, [isOpen]);

  const handleCheck = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-slideUp border border-white/40 dark:border-gray-700 relative">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 text-center">
             <h3 className="text-xl font-bold text-gray-800 dark:text-white">📸 Проверка фото перед примеркой</h3>
             <p className="text-sm text-gray-500 mt-1">Чтобы нейросеть сработала идеально, убедитесь, что фото подходит.</p>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto max-h-[70vh]">
            <div className="w-full md:w-1/2 aspect-3/4 relative rounded-2xl overflow-hidden shadow-md bg-gray-100 shrink-0">
                <Image src={imageSrc} alt="Preview" fill className="object-cover" unoptimized />
                 {brightnessWarning && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs p-2 text-center font-bold backdrop-blur-sm">
                        {brightnessWarning}
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {brightnessWarning && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                     <span>⚠️</span> Обнаружена проблема со светом. Проверьте фото.
                  </div>
                )}
                <p className="font-bold text-gray-700 dark:text-gray-300 mb-4 text-sm">Отметьте галочками, что это верно:</p>
                <div className="space-y-3">
                    {VALIDATION_CHECKLIST.map((item) => (
                        <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${checkedItems[item.id] ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-pink-300'}`}>
                            <div className={`relative shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${checkedItems[item.id] ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 group-hover:border-pink-400'}`}>
                                {!checkedItems[item.id] && <span className="absolute inset-0 rounded-md bg-pink-400 opacity-20 animate-ping"></span>}
                                {checkedItems[item.id] && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 leading-tight select-none">{item.label}</span>
                            <input type="checkbox" className="hidden" checked={checkedItems[item.id] || false} onChange={() => handleCheck(item.id)} />
                        </label>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-medium">Выбрать другое</button>
            <button 
                onClick={onConfirm}
                disabled={!allChecked || !!brightnessWarning}
                className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all flex items-center gap-2
                    ${allChecked && !brightnessWarning
                        ? 'bg-linear-to-r from-green-500 to-emerald-600 hover:shadow-green-500/40 hover:-translate-y-0.5' 
                        : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-70'}`}
            >
                Подтвердить и продолжить
            </button>
        </div>
      </div>
    </div>
  );
}

// --- ОСНОВНОЙ КОМПОНЕНТ ---
export default function TryOnModal({ isOpen, onClose, garmentImage }) {
  const [personImage, setPersonImage] = useState(null);
  const [tempUploadedImage, setTempUploadedImage] = useState(null); 
  const [isValidationOpen, setIsValidationOpen] = useState(false);

  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [step, setStep] = useState('upload'); 
  const [compliment, setCompliment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Состояния для анимации загрузки
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const [user, setUser] = useState(null);
  const [remainingTries, setRemainingTries] = useState(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    if (!isOpen) {
      setTimeout(() => resetAll(), 300);
    }
    return () => unsubscribe();
  }, [isOpen]);

  // Эффект для анимации текста и прогресс-бара во время загрузки
  useEffect(() => {
    let msgInterval;
    let progressInterval;

    if (loading && step === 'processing') {
      // 1. Меняем сообщения каждые 4.5 секунды
      setLoadingStepIndex(0);
      msgInterval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 4500);

      // 2. Имитация прогресс-бара (доходит до 95% за 50 секунд)
      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress((prev) => {
            // Быстро в начале, медленно в конце
            if (prev >= 95) return 95; // Замираем на 95%
            const increment = prev < 50 ? 1.5 : prev < 80 ? 0.5 : 0.1;
            return prev + increment;
        });
      }, 500);
    }

    return () => {
        clearInterval(msgInterval);
        clearInterval(progressInterval);
    };
  }, [loading, step]);

  const resetAll = () => {
    setPersonImage(null);
    setTempUploadedImage(null);
    setGeneratedImage(null);
    setStep('upload');
    setError(null);
    setWarning(null);
    setLoading(false);
    setIsDragging(false);
    setIsLimitReached(false);
    setIsValidationOpen(false);
    setProgress(0);
  };

  const analyzeImageQuality = (imgElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    let colorSum = 0;
    for (let x = 0, len = imageData.length; x < len; x += 40) {
      colorSum += Math.floor((imageData[x] + imageData[x + 1] + imageData[x + 2]) / 3);
    }
    const brightness = Math.floor(colorSum / (imageData.length / 40));

    if (brightness < 50) return "⚠️ Очень темное фото. Результат будет плохим.";
    if (brightness > 230) return "⚠️ Фото засвечено. Детали могут пропасть.";
    return null;
  };

  const compressAndAnalyzeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const qualityWarning = analyzeImageQuality(img);
          setWarning(qualityWarning);

          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1280; 
          let width = img.width; let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }} 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }}
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const applyBranding = async (imageUrl) => {
    return new Promise((resolve) => {
        const img = new window.Image(); img.crossOrigin = "Anonymous"; img.src = imageUrl;
        img.onload = () => {
          const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
          canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0);
          const logo = new window.Image(); logo.src = LOGO_PATH;
          logo.onload = () => {
            const logoWidth = canvas.width * 0.20; const logoHeight = logo.height * (logoWidth / logo.width);
            ctx.globalAlpha = 0.9; ctx.drawImage(logo, canvas.width - logoWidth - (canvas.width * 0.05), (canvas.width * 0.05), logoWidth, logoHeight);
            resolve(canvas.toDataURL('image/png'));
          };
          logo.onerror = () => resolve(imageUrl);
        };
        img.onerror = () => resolve(imageUrl);
      });
  };

  const processFile = async (file) => {
    setError(null); setWarning(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setError('Поддерживаются только JPG, PNG, WEBP.'); return; }
    if (file.size > MAX_INPUT_SIZE_MB * 1024 * 1024) { setError(`Файл слишком большой (макс ${MAX_INPUT_SIZE_MB} МБ).`); return; }

    try {
        setLoading(true);
        const compressedImage = await compressAndAnalyzeImage(file);
        setTempUploadedImage(compressedImage);
        setIsValidationOpen(true);
    } catch (err) {
        console.error("Ошибка обработки:", err); setError("Не удалось обработать изображение.");
    } finally {
        setLoading(false);
    }
  };

  const handleValidationConfirm = () => {
      setPersonImage(tempUploadedImage); 
      setIsValidationOpen(false);
      setWarning(null); 
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); }, []);

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) return;
    setLoading(true); setError(null); setIsLimitReached(false); setStep('processing');

    try {
      const startResponse = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personImage, garmentImage, userId: user?.uid || null }),
      });

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        if (startData.error === 'LIMIT_REACHED_GUEST' || startData.error === 'LIMIT_REACHED_BUY') {
          setError(startData.message || 'Лимит исчерпан.');
          setIsLimitReached(true); setStep('upload'); setLoading(false); return;
        }
        throw new Error(startData.error || "Ошибка запуска");
      }

      let prediction = startData;
      while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise(r => setTimeout(r, 3000));
        const check = await fetch(`/api/try-on?id=${prediction.id}`);
        if (check.ok) prediction = await check.json();
      }

      if (prediction.status === 'failed') throw new Error("Нейросеть не справилась с фото. Попробуйте другое.");

      let finalUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      const brandedImage = await applyBranding(finalUrl);

      if (prediction.remaining !== undefined) setRemainingTries(prediction.remaining);

      setCompliment(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
      setGeneratedImage(brandedImage);
      setProgress(100); // Сразу завершаем прогресс
      await new Promise(r => setTimeout(r, 500)); // Небольшая пауза чтобы увидеть 100%
      setStep('result');

    } catch (err) {
      setError(err.message || 'Ошибка генерации.'); setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    const link = document.createElement('a'); link.href = generatedImage; link.download = `parizod-${Date.now()}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!isOpen) return null;

  // --- НОВЫЙ RENDER PROCESSING ---
  const renderProcessing = () => {
    const currentStep = LOADING_STEPS[loadingStepIndex];
    return (
        <div className="flex flex-col items-center justify-center h-[400px] text-center animate-fadeIn w-full max-w-md mx-auto">
          {/* Анимированный круг */}
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-8 border-gray-100 dark:border-gray-800 rounded-full"></div>
            <div 
                className="absolute inset-0 border-8 border-primary-pink rounded-full border-t-transparent animate-spin"
                style={{ animationDuration: '2s' }}
            ></div>
            {/* Эмодзи внутри круга */}
            <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce-slow">
                {currentStep.emoji}
            </div>
          </div>
    
          {/* Меняющийся текст */}
          <div className="h-16 flex items-center justify-center w-full px-4">
              <h4 
                key={loadingStepIndex} // Ключ заставляет React перерисовывать анимацию при смене текста
                className="text-xl font-bold text-gray-800 dark:text-white animate-slideUp leading-tight"
              >
                {currentStep.text}
              </h4>
          </div>
          
          {/* Прогресс-бар */}
          <div className="w-full mt-6 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden relative">
              <div 
                className="bg-linear-to-r from-pink-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out relative" 
                style={{ width: `${Math.floor(progress)}%` }}
              >
                  {/* Блик на прогресс-баре */}
                  <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
              </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 font-mono">{Math.floor(progress)}%</p>
    
          <p className="text-gray-400 text-sm mt-8 max-w-xs mx-auto opacity-70">
            Обычно это занимает около 40-60 секунд. Пожалуйста, не закрывайте окно.
          </p>
        </div>
      );
  };

  const renderResult = () => (
    <div className="flex flex-col items-center animate-slideUp">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2">{compliment}</h2>
        <p className="text-gray-500 text-sm">Готово!</p>
        {remainingTries !== null && <p className="text-xs text-gray-400 mt-1">Осталось попыток: <b>{remainingTries}</b></p>}
      </div>
      <div className="relative w-full max-w-md aspect-3/4 rounded-2xl overflow-hidden shadow-2xl mb-8 group ring-4 ring-pink-50 dark:ring-gray-800 bg-gray-100">
        <img src={generatedImage} alt="Результат" className="w-full h-full object-cover"/>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button onClick={handleDownload} className="flex-1 px-8 py-4 bg-linear-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-pink-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">Скачать фото</button>
        <button onClick={resetAll} className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-50 transition-colors">Ещё раз</button>
      </div>
      <p className="text-[10px] text-gray-400 mt-6 text-center max-w-xs">Образ создан ИИ. Возможны незначительные артефакты. Мы не сохраняем ваши фото.</p>
    </div>
  );

  const renderUpload = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-full">
      <div className="flex flex-col gap-4 h-full">
        <p className="font-bold text-gray-700 dark:text-white flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">1</span> Ваше фото</p>
        
        <div className="p-3 rounded-xl border text-xs flex gap-2 items-start transition-colors bg-blue-50 border-blue-100 text-blue-700">
            <span className="text-lg">ℹ️</span>
            <div>
                {!user ? <>Вы <b>Гость</b> (1 попытка). <a href="/register" className="underline font-bold">Войдите</a>, чтобы получить 3.</> : <>У вас есть лимитированные попытки.</>}
            </div>
        </div>

        <div className={`flex-1 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 min-h-62.5 relative overflow-hidden ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400'} ${loading ? 'opacity-50 pointer-events-none' : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => !personImage && !loading && fileInputRef.current?.click()}>
          {loading ? (
             <div className="text-pink-500 font-medium animate-pulse">Обработка фото...</div>
          ) : personImage ? (
            <>
              <Image src={personImage} alt="Вы" fill className="object-cover rounded-xl" unoptimized />
              <button onClick={(e) => { e.stopPropagation(); setPersonImage(null); }} className="absolute top-3 right-3 bg-white/90 rounded-full p-2 text-red-500 shadow-lg hover:scale-110 transition-all z-10">✕</button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-500/90 text-white text-xs px-3 py-1.5 rounded-full font-bold backdrop-blur-sm shadow-sm flex items-center gap-1">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Фото проверено
              </div>
            </>
          ) : (
            <div className="text-center p-6 pointer-events-none">
              <div className="text-4xl mb-2">📸</div>
              <span className="font-bold text-gray-700 dark:text-gray-200 block">Загрузить фото</span>
              <span className="text-xs text-gray-400 block mt-1">JPG, PNG до 30 МБ</span>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={ALLOWED_TYPES.join(',')} className="hidden" disabled={loading} />
        </div>
      </div>

      <div className="flex flex-col gap-4 h-full">
        <p className="font-bold text-gray-700 dark:text-white flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">2</span> Одежда</p>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center p-4 min-h-75 relative">
          {garmentImage ? (<ClientImage src={garmentImage} alt="Одежда" fill className="object-contain p-4" />) : (<p className="text-gray-400">Нет фото</p>)}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn ${!isOpen ? 'hidden' : ''}`}>
        <div className="absolute inset-0" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] z-10 border border-white/40 dark:border-gray-700">
          <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-white/50 backdrop-blur-sm">
            <h3 className="text-2xl font-bold bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3"><span className="text-2xl">✨</span> Виртуальная примерочная</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500 transition-all">✕</button>
          </div>
          
          <div className="p-6 md:p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
            {step === 'processing' && renderProcessing()}
            {step === 'result' && generatedImage && renderResult()}
            {step === 'upload' && renderUpload()}
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex flex-col items-center gap-2 animate-shake">
                <span className="font-medium text-center">{error}</span>
                {isLimitReached && ( !user ? <a href="/register" className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg">Зарегистрироваться</a> : <button onClick={onClose} className="text-sm bg-dark-teal text-white px-4 py-2 rounded-lg">Вернуться к покупкам</button> )}
              </div>
            )}
          </div>

          {step === 'upload' && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/80 backdrop-blur-sm">
              <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-medium">Отмена</button>
              <button 
                onClick={handleTryOn} 
                disabled={!personImage || loading || isLimitReached} 
                className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all flex items-center gap-2 
                  ${personImage && !loading && !isLimitReached
                    ? 'bg-linear-to-r from-pink-600 to-purple-600 hover:shadow-pink-500/40 hover:-translate-y-0.5' 
                    : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-70'}`}
              >
                {loading ? <>Запуск...</> : <>✨ Примерить</>}
              </button>
            </div>
          )}
        </div>
      </div>

      <PhotoValidationModal 
        isOpen={isValidationOpen} 
        onClose={() => setIsValidationOpen(false)}
        onConfirm={handleValidationConfirm}
        imageSrc={tempUploadedImage}
        brightnessWarning={warning}
      />
    </>
  );
}