// src/components/TryOn/UploadView.js
import Image from 'next/image';
import ClientImage from '../ClientImage'; 
import { ALLOWED_TYPES } from './utils';

export default function UploadView({ 
    user, category, setCategory, personImage, setPersonImage, 
    garmentImage, loading, isLimitReached, processFile, fileInputRef,
    isDragging, setIsDragging, onStart, 
    onOpenTutorial // 🔥 Новая пропса
}) {
    
    // Рендер переключателя категорий
    const renderCategoryInfo = () => {
        const labels = {
            'upper_body': 'Верх (Футболка)',
            'lower_body': 'Низ (Штаны)',
            'dresses': 'Платье / Костюм'
        };
        return (
            <div className="mb-4">
                <p className="font-bold text-gray-700 dark:text-white flex items-center gap-2 mb-2">
                   <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">1</span> 
                   Режим примерки:
                </p>
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {Object.keys(labels).map((key) => (
                        <button key={key} onClick={() => setCategory(key)} className={`flex-1 text-xs py-2 px-1 rounded-lg font-bold transition-all ${category === key ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            {labels[key]}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const handleFileChange = (e) => processFile(e.target.files[0]);
    const onDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                    {/* Колонка 1: Выбор и Загрузка */}
                    <div className="flex flex-col gap-4">
                        {renderCategoryInfo()}

                        <div className="flex justify-between items-center">
                            <p className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">2</span> 
                                Ваше фото
                            </p>
                            {/* 🔥 Кнопка открытия туториала */}
                            <button 
                                onClick={onOpenTutorial}
                                className="text-xs text-pink-600 font-bold hover:underline flex items-center gap-1 bg-pink-50 px-2 py-1 rounded-lg"
                            >
                                💡 Как это работает?
                            </button>
                        </div>
                        
                        <div className="p-3 rounded-xl border text-xs flex gap-2 items-start bg-blue-50 border-blue-100 text-blue-700">
                            <span className="text-lg">ℹ️</span>
                            <div>{!user ? <>Вы <b>Гость</b>. <a href="/register" className="underline font-bold">Войдите</a> для доп. попыток.</> : <>Лимитированные попытки.</>}</div>
                        </div>

                        <div 
                            className={`flex-1 min-h-[250px] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 relative overflow-hidden ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400'} ${loading ? 'opacity-50 pointer-events-none' : ''}`} 
                            onDragOver={(e)=>{e.preventDefault(); setIsDragging(true)}} 
                            onDragLeave={(e)=>{e.preventDefault(); setIsDragging(false)}} 
                            onDrop={onDrop} 
                            onClick={() => !personImage && !loading && fileInputRef.current?.click()}
                        >
                            {loading ? (
                                <div className="text-pink-500 font-medium animate-pulse">Обработка...</div>
                            ) : personImage ? (
                                <>
                                    <Image src={personImage} alt="Вы" fill className="object-cover rounded-xl" unoptimized />
                                    <button onClick={(e) => { e.stopPropagation(); setPersonImage(null); }} className="absolute top-3 right-3 bg-white rounded-full p-2 text-red-500 shadow-lg z-10 hover:scale-110 transition-transform">✕</button>
                                    <div className="absolute bottom-3 bg-green-500/90 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">Фото готово</div>
                                </>
                            ) : (
                                <div className="text-center p-6 pointer-events-none">
                                    <div className="text-4xl mb-2">📸</div>
                                    <span className="font-bold text-gray-700 block">Загрузить фото</span>
                                    <span className="text-xs text-gray-400 block mt-1">JPG, PNG</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={ALLOWED_TYPES.join(',')} className="hidden" disabled={loading} />
                        </div>
                    </div>

                    {/* Колонка 2: Одежда */}
                    <div className="flex flex-col gap-4">
                        <p className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">3</span> 
                            Одежда
                        </p>
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 flex items-center justify-center p-4 min-h-[250px] relative">
                            {garmentImage ? (<ClientImage src={garmentImage} fill className="object-contain p-4" />) : (<p className="text-gray-400">Нет фото</p>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Футер с кнопкой */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/80 backdrop-blur-sm">
                <button disabled={!personImage || loading || isLimitReached} onClick={onStart} className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all ${personImage && !loading ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-105' : 'bg-gray-300 cursor-not-allowed'}`}>
                    {loading ? 'Запуск...' : '✨ Примерить'}
                </button>
            </div>
        </div>
    );
}