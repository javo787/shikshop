'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function TryOnModal({ isOpen, onClose, garmentImage }) {
  const [personImage, setPersonImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload', 'processing', 'result'
  const fileInputRef = useRef(null);

  // Сброс при закрытии
  useEffect(() => {
    if (!isOpen) {
      setPersonImage(null);
      setGeneratedImage(null);
      setStep('upload');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // 🔥 САМОЕ ГЛАВНОЕ: Если закрыто — ничего не показываем
  if (!isOpen) return null;

  // Обработка загрузки файла без лишних компонентов
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPersonImage(reader.result);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

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

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка генерации');
      }

      setGeneratedImage(data.resultImage || data.image); // Поддержка разных форматов ответа
      setStep('result');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Произошла ошибка.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setGeneratedImage(null);
    setStep('upload');
    setError(null);
    setPersonImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Клик по фону закрывает окно */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        
        {/* Шапка */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            ✨ Виртуальная примерочная
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {step === 'processing' ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mb-4"></div>
              <p className="text-lg font-medium dark:text-white">Нейросеть примеряет наряд...</p>
              <p className="text-sm text-gray-500 mt-2">Это займет около 15-30 секунд.</p>
            </div>
          ) : step === 'result' && generatedImage ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden shadow-lg mb-6 bg-gray-100">
                <Image 
                  src={generatedImage} 
                  alt="Результат" 
                  fill 
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={reset}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-white dark:hover:text-black transition"
                >
                  Попробовать другое
                </button>
                <a 
                  href={generatedImage} 
                  download="parizod-look.png" 
                  target="_blank"
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition shadow-md"
                >
                  Скачать
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Слева: Фото пользователя */}
              <div className="flex flex-col gap-4">
                <p className="font-medium dark:text-white">1. Ваше фото</p>
                <div 
                  className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 min-h-[300px] relative overflow-hidden cursor-pointer hover:border-pink-400 transition"
                  onClick={() => !personImage && fileInputRef.current?.click()}
                >
                  {personImage ? (
                    <>
                      <img src={personImage} alt="Вы" className="w-full h-full object-contain" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPersonImage(null); }}
                        className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-red-50 text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2">📸</div>
                      <span className="text-gray-500 dark:text-gray-300">Нажмите, чтобы загрузить фото</span>
                      <p className="text-xs text-gray-400 mt-2">Рекомендуется фото в полный рост</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>

              {/* Справа: Одежда */}
              <div className="flex flex-col gap-4">
                <p className="font-medium dark:text-white">2. Одежда</p>
                <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 flex items-center justify-center p-4 min-h-[300px] relative">
                  {garmentImage ? (
                    <Image src={garmentImage} alt="Одежда" fill className="object-contain p-2" unoptimized />
                  ) : (
                    <p className="text-red-500">Нет фото товара</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Подвал с кнопками */}
        {step === 'upload' && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 transition"
            >
              Отмена
            </button>
            <button 
              onClick={handleTryOn}
              disabled={!personImage || loading}
              className={`px-6 py-2 rounded-lg text-white font-medium shadow-md transition-all
                ${personImage && !loading 
                  ? 'bg-pink-600 hover:bg-pink-700 transform hover:scale-105' 
                  : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Примерить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}