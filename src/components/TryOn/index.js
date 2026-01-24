'use client';

import { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { applyBranding, analyzeImageQuality, compressBase64Image, COMPLIMENTS, LOADING_STEPS, ALLOWED_TYPES } from './utils';

import UploadView from './UploadView';
import ResultView from './ResultView';
import ProcessingView from './ProcessingView';
import PhotoValidationModal from './PhotoValidationModal';
import TutorialModal from './TutorialModal';
import ImageCropper from './ImageCropper';

// 🔥 Важно: принимаем garmentCategory, как в оригинале
export default function TryOnModal({ isOpen, onClose, garmentImage, productId, garmentCategory }) {
  const [step, setStep] = useState('upload'); 
  // Если garmentCategory не передан, по умолчанию upper_body
  const [category, setCategory] = useState(garmentCategory || 'upper_body');
  
  const [personImage, setPersonImage] = useState(null);
  
  // Состояния для Кроппера
  const [tempImageForCrop, setTempImageForCrop] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const [tempUploadedImage, setTempUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [compliment, setCompliment] = useState('');
  
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [user, setUser] = useState(null);
  const [remainingTries, setRemainingTries] = useState(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  
  const fileInputRef = useRef(null);

  // --- 💾 1. Управление состоянием при открытии/закрытии (Persistence) ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    
    if (isOpen) {
      // При открытии: восстанавливаем фото из LocalStorage, если есть
      const savedImage = localStorage.getItem('parizod_user_photo');
      if (savedImage) {
         setPersonImage(savedImage);
      }
      
      // Синхронизируем категорию
      if (garmentCategory) setCategory(garmentCategory);
    } else {
      // При закрытии: сбрасываем стейт (но не удаляем из LocalStorage, чтобы сохранить на будущее)
      setTimeout(() => resetAll(), 300);
    }

    return () => unsubscribe();
  }, [isOpen, garmentCategory]);

  useEffect(() => {
    let msgInterval, progressInterval;
    if (loading && step === 'processing') {
      setLoadingStepIndex(0);
      msgInterval = setInterval(() => setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length), 4500);
      setProgress(0);
      progressInterval = setInterval(() => setProgress((prev) => (prev >= 95 ? 95 : prev + (prev < 50 ? 1.5 : prev < 80 ? 0.5 : 0.1))), 500);
    }
    return () => { clearInterval(msgInterval); clearInterval(progressInterval); };
  }, [loading, step]);

  const resetAll = () => {
    // Сбрасываем только UI состояния
    setPersonImage(null); setTempUploadedImage(null); setGeneratedImage(null);
    setTempImageForCrop(null); setIsCropperOpen(false);
    setStep('upload'); setError(null); setWarning(null); setLoading(false);
    setIsDragging(false); setIsLimitReached(false); setIsValidationOpen(false); setProgress(0);
    if (garmentCategory) setCategory(garmentCategory);
  };

  const handleRetry = () => {
      // Сбрасываем только результат, фото пользователя оставляем
      setStep('upload');
      setGeneratedImage(null);
  };

  // --- 🗑️ Функция для полного удаления фото (и из памяти, и из хранилища) ---
  const handleClearUserPhoto = (val) => {
      setPersonImage(val);
      // Если передали null (нажали крестик), удаляем из памяти браузера
      if (val === null) {
          localStorage.removeItem('parizod_user_photo');
      }
  };

  // 1. Начало процесса: Читаем файл и открываем Кроппер
  const processFile = (file) => {
    if (!file || !ALLOWED_TYPES.includes(file.type)) { setError('Только фото (JPG, PNG)'); return; }
    
    const reader = new FileReader();
    reader.onload = () => {
        setTempImageForCrop(reader.result);
        setIsCropperOpen(true);
        setError(null);
    };
    reader.readAsDataURL(file);
  };

  // 2. Кроппер завершен: СЖИМАЕМ и проверяем
  const handleCropComplete = async (croppedImageBase64) => {
      setIsCropperOpen(false);
      
      try {
          // 🔥 Сжимаем обрезанное фото до нормального размера (макс 1280px)
          const compressed = await compressBase64Image(croppedImageBase64);
          
          const img = new Image();
          img.src = compressed;
          img.onload = () => {
              const warn = analyzeImageQuality(img);
              setWarning(warn);
              setTempUploadedImage(compressed);
              setIsValidationOpen(true);
          };
      } catch (e) {
          console.error("Compression error", e);
          setError("Ошибка обработки фото");
      }
  };

  // --- 💾 2. Сохраняем фото при подтверждении (БЕЗОПАСНАЯ ВЕРСИЯ) ---
  const handleValidationConfirm = () => {
      setPersonImage(tempUploadedImage); 
      
      try {
          // Пытаемся сохранить в LocalStorage
          localStorage.setItem('parizod_user_photo', tempUploadedImage);
      } catch (e) {
          // Если места нет (QuotaExceededError), просто выводим предупреждение в консоль
          // Приложение продолжит работать, просто в следующий раз фото придется грузить заново
          console.warn("Не удалось сохранить фото (возможно, нет места):", e);
      }
      
      setIsValidationOpen(false);
      setWarning(null); 
  };

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) return;
    setLoading(true); setError(null); setIsLimitReached(false); setStep('processing');

    try {
      const startRes = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            personImage, 
            garmentImage, 
            userId: user?.uid || null, 
            category: category
        }),
      });
      const startData = await startRes.json();
      
      if (!startRes.ok) {
        if (startData.error === 'LIMIT_REACHED_GUEST' || startData.error === 'LIMIT_REACHED_BUY') {
            setError(startData.message || 'Лимит исчерпан.');
            setIsLimitReached(true); setStep('upload'); setLoading(false); return;
        }
        throw new Error(startData.message || startData.error || "Ошибка запуска");
      }

      const predictionId = startData.id;
      let pred = startData;
      while (pred.status !== 'succeeded' && pred.status !== 'failed') {
        await new Promise(r => setTimeout(r, 3000));
        const check = await fetch(`/api/try-on?id=${predictionId}`);
        if (check.ok) pred = await check.json();
      }

      if (pred.status === 'failed') throw new Error("Нейросеть не справилась с фото.");

      const finalUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      const branded = await applyBranding(finalUrl);

      // Обновляем историю
      fetch('/api/try-on', { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
          predictionId: pred.id, userId: user?.uid, productId, personImage, garmentImage, modelParams: pred.modelParams
      })});

      if (pred.remaining !== undefined) setRemainingTries(pred.remaining);
      setCompliment(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
      setGeneratedImage(branded);
      setProgress(100); 
      await new Promise(r => setTimeout(r, 500));
      setStep('result');

    } catch (err) {
      setError(err.message || 'Ошибка генерации'); setStep('upload');
    } finally { setLoading(false); }
  };

  const handleDownload = () => {
    const link = document.createElement('a'); link.href = generatedImage; link.download = 'parizod-' + Date.now() + '.png';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn " + (!isOpen ? "hidden" : "")}>
        <div className="absolute inset-0" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-full max-h-[95vh] z-10 border border-white/40 dark:border-gray-700">
          
          <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-white/50 backdrop-blur-sm shrink-0">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">✨ Виртуальная примерочная</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-200">
            {step === 'processing' && (
                <ProcessingView loadingStepIndex={loadingStepIndex} progress={progress} />
            )}
            
            {step === 'result' && generatedImage && (
                <ResultView 
                    generatedImage={generatedImage} 
                    // 🔥 Передаем исходное фото для слайдера До/После
                    personImage={personImage} 
                    compliment={compliment} 
                    handleDownload={handleDownload} 
                    onRetry={handleRetry} 
                    remainingTries={remainingTries} 
                />
            )}

            {step === 'upload' && (
                <UploadView 
                    user={user} category={category} setCategory={setCategory}
                    personImage={personImage} 
                    // 🔥 Используем обертку для удаления из LocalStorage
                    setPersonImage={handleClearUserPhoto} 
                    garmentImage={garmentImage} loading={loading}
                    isLimitReached={isLimitReached} processFile={processFile}
                    fileInputRef={fileInputRef} isDragging={isDragging}
                    setIsDragging={setIsDragging} onStart={handleTryOn}
                    garmentCategoryProp={garmentCategory} 
                />
            )}

            {error && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center font-medium animate-shake shadow-lg z-20">
                    {error}
                </div>
            )}
          </div>
        </div>
      </div>

      {isCropperOpen && (
          <ImageCropper 
            imageSrc={tempImageForCrop}
            onCropComplete={handleCropComplete}
            onCancel={() => { setIsCropperOpen(false); setTempImageForCrop(null); }}
          />
      )}

      <PhotoValidationModal 
        isOpen={isValidationOpen} 
        onClose={() => setIsValidationOpen(false)} 
        onConfirm={handleValidationConfirm} 
        imageSrc={tempUploadedImage} 
        brightnessWarning={warning} 
      />

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </>
  );
}