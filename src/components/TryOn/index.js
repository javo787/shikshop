'use client';
import { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { analyzeImageQuality, compressBase64Image, COMPLIMENTS, LOADING_STEPS, ALLOWED_TYPES } from './utils';
// applyBranding УДАЛЕН из импортов

import UploadView from './UploadView';
import ResultView from './ResultView';
import ProcessingView from './ProcessingView';
import PhotoValidationModal from './PhotoValidationModal';
import TutorialModal from './TutorialModal';
import ImageCropper from './ImageCropper';

export default function TryOnModal({ isOpen, onClose, garmentImage, productId, garmentCategory }) {
  const [step, setStep] = useState('upload'); 
  const [category, setCategory] = useState(garmentCategory || 'upper_body');
  
  // 🔥 НОВОЕ: Выбор модели (по умолчанию Google, так как он быстрый)
  // Варианты: 'google-vertex' или 'replicate-idm-vton'
  const [modelKey, setModelKey] = useState('google-vertex');

  const [personImage, setPersonImage] = useState(null);
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

  // трай онди янги одам очганда мажбурлаб курсатиш коментариялаб куилди
  //useEffect(() => {
   // if (isOpen) {
       // const hasSeenTutorial = localStorage.getItem('parizod_tutorial_seen');
       // if (!hasSeenTutorial) {
           // setIsTutorialOpen(true);
           // localStorage.setItem('parizod_tutorial_seen', 'true');
      //  }
  //  }
  //}, [isOpen]);

  const handleManualTutorialOpen = () => setIsTutorialOpen(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    if (isOpen) {
      const savedImage = localStorage.getItem('parizod_user_photo');
      if (savedImage) setPersonImage(savedImage);
      if (garmentCategory) setCategory(garmentCategory);
    } else {
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
      // Если Replicate (качественно), прогресс идет медленнее
      const speed = modelKey === 'google-vertex' ? 2 : 0.5;
      progressInterval = setInterval(() => setProgress((prev) => (prev >= 95 ? 95 : prev + speed)), 500);
    }
    return () => { clearInterval(msgInterval); clearInterval(progressInterval); };
  }, [loading, step, modelKey]);

  const resetAll = () => {
    setPersonImage(null); setTempUploadedImage(null); setGeneratedImage(null);
    setTempImageForCrop(null); setIsCropperOpen(false);
    setStep('upload'); setError(null); setWarning(null); setLoading(false);
    setIsDragging(false); setIsLimitReached(false); setIsValidationOpen(false); setProgress(0);
    if (garmentCategory) setCategory(garmentCategory);
  };

  const handleRetry = () => {
      setStep('upload');
      setGeneratedImage(null);
  };

  const handleClearUserPhoto = (val) => {
      setPersonImage(val);
      if (val === null) localStorage.removeItem('parizod_user_photo');
  };

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

  const handleCropComplete = async (croppedImageBase64) => {
      setIsCropperOpen(false);
      try {
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

  const handleValidationConfirm = () => {
      setPersonImage(tempUploadedImage); 
      try { localStorage.setItem('parizod_user_photo', tempUploadedImage); } catch (e) { console.warn(e); }
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
            category: category,
            modelKey: modelKey // 🔥 ПЕРЕДАЕМ ВЫБРАННУЮ МОДЕЛЬ
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
      
      // Поллинг (ожидание)
      while (pred.status !== 'succeeded' && pred.status !== 'failed') {
        await new Promise(r => setTimeout(r, 3000));
        const check = await fetch(`/api/try-on?id=${predictionId}`);
        if (check.ok) pred = await check.json();
      }

      if (pred.status === 'failed') throw new Error("Нейросеть не справилась с фото.");

      // Получаем результат (он уже может быть с логотипом от бэкенда)
      let finalUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      
      // 🔥 Логотип накладывать на фронте НЕ НУЖНО, бэкенд это делает (PUT)
      // Мы просто вызываем PUT для сохранения статистики/писем и получения фин. ссылки
      const putRes = await fetch('/api/try-on', { 
          method: 'PUT', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify({
             predictionId: pred.id, userId: user?.uid, productId, personImage, garmentImage, 
             resultImageOverride: finalUrl // Передаем то, что получили
          })
      });
      
      const putData = await putRes.json();
      // Если бэкенд вернул brandedImage, используем его
      if (putData.brandedImage) finalUrl = putData.brandedImage;

      if (pred.remaining !== undefined) setRemainingTries(pred.remaining);
      setCompliment(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
      setGeneratedImage(finalUrl);
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
      <div className={"fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-fadeIn " + (!isOpen ? "hidden" : "")}>
        <div className="absolute inset-0" onClick={onClose}></div>
        {/* 🔥 overflow-hidden и max-h-screen важны для фиксации футера */}
        <div className="relative bg-white dark:bg-gray-900 md:rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-full md:h-[90vh] z-10">
          
          <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shrink-0 z-20">
            <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                ✨ Виртуальная примерка
            </h3>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
          </div>
          
          {/* Контент скроллится здесь */}
          <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-200">
            {step === 'processing' && (
                <ProcessingView loadingStepIndex={loadingStepIndex} progress={progress} />
            )}
            
            {step === 'result' && generatedImage && (
                <ResultView 
                    generatedImage={generatedImage} 
                    personImage={personImage} 
                    compliment={compliment} 
                    handleDownload={handleDownload} 
                    onRetry={handleRetry} 
                    remainingTries={remainingTries} 
                />
            )}

            {step === 'upload' && (
                <UploadView 
                    user={user} 
                    category={category} 
                    setCategory={setCategory}
                    modelKey={modelKey} // Передаем модель
                    setModelKey={setModelKey} // Передаем сеттер
                    personImage={personImage} 
                    setPersonImage={handleClearUserPhoto} 
                    garmentImage={garmentImage} 
                    loading={loading}
                    isLimitReached={isLimitReached} 
                    processFile={processFile}
                    fileInputRef={fileInputRef} 
                    isDragging={isDragging}
                    setIsDragging={setIsDragging} 
                    onStart={handleTryOn}
                    onOpenTutorial={handleManualTutorialOpen}
                />
            )}

            {error && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 p-4 bg-red-100 text-red-700 rounded-xl text-center font-bold shadow-2xl z-50 border-2 border-red-200">
                    {error}
                    <button onClick={() => setError(null)} className="block w-full mt-2 text-xs uppercase text-red-500 hover:underline">Закрыть</button>
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