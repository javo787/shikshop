'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { compressAndAnalyzeImage, applyBranding, COMPLIMENTS, LOADING_STEPS, ALLOWED_TYPES } from './utils';

// Импорт под-компонентов
import UploadView from './UploadView';
import ResultView from './ResultView';
import PhotoValidationModal from './PhotoValidationModal';
import TutorialModal from './TutorialModal';

export default function TryOnModal({ isOpen, onClose, garmentImage, productId, initialCategory }) {
  // --- STATE ---
  const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'result'
  const [category, setCategory] = useState('upper_body');
  
  const [personImage, setPersonImage] = useState(null);
  const [tempUploadedImage, setTempUploadedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false); // 🔥 State для видео
  
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

  // --- EFFECTS ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    if (!isOpen) setTimeout(() => resetAll(), 300);
    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  // Анимация загрузки
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

  // --- HANDLERS ---
  const resetAll = () => {
    setPersonImage(null); setTempUploadedImage(null); setGeneratedImage(null);
    setStep('upload'); setError(null); setWarning(null); setLoading(false);
    setIsDragging(false); setIsLimitReached(false); setIsValidationOpen(false); setProgress(0);
    if (initialCategory) setCategory(initialCategory);
  };

  // Логика кнопки "Еще раз"
  const handleRetry = () => {
      // 1. Открываем видео-обучение
      setIsTutorialOpen(true);
      // 2. Сбрасываем результат (но не закрываем модалку целиком)
      // resetAll вызовем когда он закроет видео
  };

  const handleTutorialClose = () => {
      setIsTutorialOpen(false);
      resetAll(); // Сбрасываем к началу после просмотра видео
  };

  const processFile = async (file) => {
    if (!file || !ALLOWED_TYPES.includes(file.type)) { setError('Только фото (JPG, PNG)'); return; }
    try { 
        setLoading(true); 
        const { compressed, warning } = await compressAndAnalyzeImage(file); 
        setTempUploadedImage(compressed); 
        setWarning(warning);
        setIsValidationOpen(true); 
    } 
    catch (err) { setError("Ошибка обработки фото"); } 
    finally { setLoading(false); }
  };

  const handleValidationConfirm = () => {
      setPersonImage(tempUploadedImage); 
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
        body: JSON.stringify({ personImage, garmentImage, userId: user?.uid || null, category }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.message || startData.error || "Ошибка запуска");

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

      // Save in background
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
    const link = document.createElement('a'); link.href = generatedImage; link.download = `parizod-${Date.now()}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!isOpen) return null;

  // --- RENDER ---
  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn ${!isOpen ? 'hidden' : ''}`}>
        <div className="absolute inset-0" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] z-10 border border-white/40 dark:border-gray-700 h-full max-h-[700px]">
          
          {/* HEADER */}
          <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-white/50 backdrop-blur-sm shrink-0">
            <h3 className="text-2xl font-bold bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">✨ Виртуальная примерочная</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
          </div>
          
          {/* BODY */}
          <div className="flex-1 overflow-hidden relative">
            {step === 'processing' && (
                <div className="flex flex-col items-center justify-center h-full text-center w-full max-w-md mx-auto p-6">
                    <div className="text-6xl mb-4 animate-bounce">{LOADING_STEPS[loadingStepIndex].emoji}</div>
                    <h4 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">{LOADING_STEPS[loadingStepIndex].text}</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"><div className="bg-pink-600 h-2.5 rounded-full transition-all duration-300" style={{width: `${progress}%`}}></div></div>
                    <p className="text-xs text-gray-400 mt-2">{Math.floor(progress)}%</p>
                </div>
            )}
            
            {step === 'result' && generatedImage && (
                <ResultView 
                    generatedImage={generatedImage} 
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
                    personImage={personImage}
                    setPersonImage={setPersonImage}
                    garmentImage={garmentImage}
                    loading={loading}
                    isLimitReached={isLimitReached}
                    processFile={processFile}
                    fileInputRef={fileInputRef}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                    onStart={handleTryOn}
                />
            )}

            {error && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-3/4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center font-medium animate-shake shadow-lg z-20">
                    {error}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* МОДАЛКИ ПОВЕРХ */}
      <PhotoValidationModal 
        isOpen={isValidationOpen} 
        onClose={() => setIsValidationOpen(false)} 
        onConfirm={handleValidationConfirm} 
        imageSrc={tempUploadedImage} 
        brightnessWarning={warning} 
      />

      <TutorialModal 
        isOpen={isTutorialOpen}
        onClose={handleTutorialClose}
      />
    </>
  );
}