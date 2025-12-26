'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

export default function TryOnModal({ isOpen, onClose, garmentImage }) {
  const [personImage, setPersonImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload', 'processing', 'result'

  if (!isOpen) return null;

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

      setGeneratedImage(data.image);
      setStep('result');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Произошла ошибка. Попробуйте фото меньшего размера.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setGeneratedImage(null);
    setStep('upload');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-teal rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-dark-teal dark:text-text-light flex items-center gap-2">
            ✨ Виртуальная примерочная
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {step === 'processing' ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-rose mb-4"></div>
              <p className="text-lg font-medium text-dark-teal dark:text-text-light">Нейросеть шьет ваш наряд...</p>
              <p className="text-sm text-gray-500 mt-2">Это займет около 30-40 секунд. Не закрывайте окно.</p>
            </div>
          ) : step === 'result' && generatedImage ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden shadow-lg mb-6 bg-gray-100">
                <Image 
                  src={generatedImage} 
                  alt="Результат примерки" 
                  fill 
                  className="object-cover"
                  unoptimized // Важно для внешних ссылок Gradio
                />
                 <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 text-xs rounded text-dark-teal font-bold">
                  PARIZOD AI
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={reset}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-text-light transition"
                >
                  Попробовать другое фото
                </button>
                <a 
                  href={generatedImage} 
                  download="parizod-tryon.png" 
                  target="_blank"
                  className="px-6 py-2 bg-accent-rose text-white rounded-lg hover:bg-primary-pink transition shadow-md"
                >
                  Скачать образ
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Left: User Photo */}
              <div className="flex flex-col gap-4">
                <p className="font-medium text-dark-teal dark:text-text-light">1. Ваше фото</p>
                <div className="flex-1 bg-bg-light dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 min-h-[250px] relative overflow-hidden">
                  {personImage ? (
                    <>
                      <Image src={personImage} alt="Вы" fill className="object-contain p-2" unoptimized />
                      <button 
                        onClick={() => setPersonImage(null)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                       {/* Используем твой компонент загрузки */}
                      <ImageUpload onUpload={(url) => setPersonImage(url)} label="Загрузить фото" />
                      <p className="text-xs text-gray-400 mt-2">Лучше всего работает фото в полный рост</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Garment Photo */}
              <div className="flex flex-col gap-4">
                <p className="font-medium text-dark-teal dark:text-text-light">2. Одежда</p>
                <div className="flex-1 bg-bg-light dark:bg-gray-800 rounded-xl border border-gray-200 flex items-center justify-center p-4 min-h-[250px] relative">
                  {garmentImage ? (
                    <Image src={garmentImage} alt="Одежда" fill className="object-contain p-2" unoptimized />
                  ) : (
                    <p className="text-red-500">Ошибка: Фото одежды не найдено</p>
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

        {/* Footer */}
        {step === 'upload' && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
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
                  ? 'bg-gradient-to-r from-accent-rose to-primary-pink hover:scale-105' 
                  : 'bg-gray-300 cursor-not-allowed'}`}
            >
              ✨ Примерить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}