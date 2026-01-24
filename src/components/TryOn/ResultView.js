import { useState, useRef, useEffect } from 'react';

// --- Компонент Лайтбокса (Модалка на весь экран) ---
const Lightbox = ({ imageSrc, onClose }) => {
    // Блокируем скролл страницы при открытии
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn cursor-zoom-out"
            onClick={onClose}
        >
            {/* Кнопка закрытия */}
            <button 
                onClick={onClose} 
                className="absolute top-5 right-5 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50"
            >
                ✕
            </button>

            {/* Изображение */}
            <img 
                src={imageSrc} 
                alt="Full Screen" 
                className="max-w-full max-h-full object-contain animate-scaleIn shadow-2xl rounded-lg"
                onClick={(e) => e.stopPropagation()} // Чтобы клик по фото не закрывал его
            />
            
            <div className="absolute bottom-5 text-white/50 text-sm pointer-events-none">
                Нажмите в любом месте, чтобы закрыть
            </div>
        </div>
    );
};

// --- Основной компонент ---
export default function ResultView({ 
    generatedImage, 
    personImage, 
    compliment, 
    handleDownload, 
    onRetry, 
    remainingTries 
}) {
    // Состояния слайдера
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);
    
    // Состояние зума
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    // Логика слайдера
    const handleMouseDown = () => setIsResizing(true);
    const handleMouseUp = () => setIsResizing(false);
    const handleMouseMove = (e) => {
        if (!isResizing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
    };
    const handleTouchMove = (e) => {
        if (!isResizing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchend', handleMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

    return (
        <>
            <div className="p-6 flex flex-col items-center h-full animate-fadeIn w-full">
                <div className="text-center mb-4 shrink-0">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600 leading-tight">
                        {compliment}
                    </h2>
                    {remainingTries !== null && <p className="text-xs text-gray-400 mt-1">Осталось попыток: <b>{remainingTries}</b></p>}
                </div>

                {/* --- КОНТЕЙНЕР СЛАЙДЕРА --- */}
                <div className="relative w-full max-w-md flex-1 min-h-[300px] flex justify-center">
                    <div 
                        ref={containerRef}
                        className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl cursor-col-resize select-none border-4 border-white dark:border-gray-700 bg-gray-100 touch-none"
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleTouchMove}
                        // 🔥 ВАЖНО: Запрещаем скролл страницы при касании слайдера
                        style={{ touchAction: 'none' }} 
                    >
                        {/* 1. Фото ПОСЛЕ (Фон) */}
                        <img 
                            src={generatedImage} 
                            alt="After" 
                            className="absolute inset-0 w-full h-full object-contain bg-gray-900" 
                            draggable={false}
                        />

                        {/* 2. Фото ДО (Сверху, обрезается clip-path) */}
                        {personImage && (
                            <div 
                                className="absolute inset-0 w-full h-full overflow-hidden bg-gray-900"
                                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                            >
                                <img 
                                    src={personImage} 
                                    alt="Before" 
                                    className="absolute inset-0 w-full h-full object-contain" 
                                    draggable={false}
                                />
                                <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md border border-white/20">
                                    ДО
                                </div>
                            </div>
                        )}

                        {/* Метка "ПОСЛЕ" */}
                        <div className="absolute top-4 right-4 bg-pink-600/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md border border-white/20">
                            ПОСЛЕ
                        </div>

                        {/* 3. Линия разделителя */}
                        {personImage && (
                            <div 
                                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10"
                                style={{ left: `${sliderPosition}%` }}
                            >
                                <div 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing text-pink-600 hover:scale-110 transition-transform"
                                    onMouseDown={handleMouseDown}
                                    onTouchStart={handleMouseDown}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l-3 3 3 3m8-6l3 3-3 3" /></svg>
                                </div>
                            </div>
                        )}

                        {/* 🔥 4. КНОПКА ЗУМА (Поверх слайдера) */}
                        <button 
                            onClick={() => setIsZoomOpen(true)}
                            className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg text-gray-700 dark:text-white hover:bg-white hover:scale-105 transition-all z-20 border border-gray-200 dark:border-gray-600"
                            title="Увеличить"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <p className="text-xs text-gray-400 mt-3 animate-pulse shrink-0">
                    ↔ Потяните слайдер или нажмите 🔍 для зума
                </p>

                <div className="flex gap-4 w-full max-w-md mt-6 shrink-0">
                    <button onClick={handleDownload} className="flex-1 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        Скачать 📥
                    </button>
                    <button onClick={onRetry} className="py-3.5 px-6 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Ещё раз
                    </button>
                </div>
            </div>

            {/* 🔥 МОДАЛКА ЗУМА (Рендерится условно) */}
            {isZoomOpen && (
                <Lightbox 
                    imageSrc={generatedImage} 
                    onClose={() => setIsZoomOpen(false)} 
                />
            )}
        </>
    );
}