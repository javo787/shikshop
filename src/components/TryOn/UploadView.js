// src/components/TryOn/UploadView.js
import Image from 'next/image';
import ClientImage from '../ClientImage'; 
import { ALLOWED_TYPES } from './utils';

export default function UploadView({ 
    user, category, setCategory, 
    modelKey, setModelKey, 
    personImage, setPersonImage, 
    garmentImage, loading, isLimitReached, processFile, fileInputRef,
    isDragging, setIsDragging, onStart, onOpenTutorial 
}) {
    
    const handleFileChange = (e) => processFile(e.target.files[0]);
    const onDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50">
            {/* Скроллируемая область */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
                <div className="max-w-4xl mx-auto flex flex-col gap-6">
                    
                    {/* 1. Блок одежды */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center gap-4 border border-gray-100 dark:border-gray-700">
                        <div className="w-16 h-16 relative bg-gray-100 rounded-lg shrink-0">
                             {garmentImage && <ClientImage src={garmentImage} fill className="object-contain p-1" />}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Категория:</p>
                            <div className="flex gap-2">
                                {['upper_body', 'lower_body', 'dresses'].map((cat) => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setCategory(cat)} 
                                        className={`text-[10px] md:text-xs px-3 py-1.5 rounded-full border transition-colors ${category === cat ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-transparent text-gray-500 border-gray-200'}`}
                                    >
                                        {cat === 'upper_body' ? 'Верх' : cat === 'lower_body' ? 'Низ' : 'Платье'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. 🔥 Блок выбора модели (3 варианта) */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-bold text-gray-700 dark:text-white mb-3 flex justify-between">
                            Выберите нейросеть:
                            <button onClick={onOpenTutorial} className="text-pink-600 text-xs font-medium hover:underline">Как это работает?</button>
                        </p>
                        <div className="flex flex-col md:flex-row gap-2">
                            {/* Кнопка 1: Google (Быстро) */}
                            <button 
                                onClick={() => setModelKey('google-vertex')}
                                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1
                                ${modelKey === 'google-vertex' 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                            >
                                <span>⚡ Google Vertex</span>
                                <span className="text-[9px] opacity-70 font-normal">Быстро (15с)</span>
                            </button>

                            {/* Кнопка 2: Replicate VTON (Качество) */}
                            <button 
                                onClick={() => setModelKey('replicate-idm-vton')}
                                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1
                                ${modelKey === 'replicate-idm-vton' 
                                    ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' 
                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                            >
                                <span>✨ IDM VTON (Pro)</span>
                                <span className="text-[9px] opacity-70 font-normal">Детально (40с)</span>
                            </button>

                            {/* Кнопка 3: Nano Banana (Новинка) */}
                            <button 
                                onClick={() => setModelKey('google-nano-banana')}
                                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1
                                ${modelKey === 'google-nano-banana' 
                                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 shadow-sm' 
                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                            >
                                <span>🍌 Nano Banana</span>
                                <span className="text-[9px] opacity-70 font-normal">Эксперимент (New)</span>
                            </button>
                        </div>
                    </div>

                    {/* 3. Блок загрузки фото */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-bold text-gray-700 dark:text-white mb-3">Ваше фото:</p>
                        
                        <div 
                            className={`min-h-[220px] rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400'}`} 
                            onDragOver={(e)=>{e.preventDefault(); setIsDragging(true)}} 
                            onDragLeave={(e)=>{e.preventDefault(); setIsDragging(false)}} 
                            onDrop={onDrop} 
                            onClick={() => !personImage && !loading && fileInputRef.current?.click()}
                        >
                            {loading ? (
                                <div className="text-pink-500 font-medium animate-pulse flex flex-col items-center">
                                    <span className="text-2xl mb-2">🧵</span>
                                    Шьем наряд...
                                </div>
                            ) : personImage ? (
                                <>
                                    <Image src={personImage} alt="Вы" fill className="object-cover" unoptimized />
                                    <div className="absolute inset-0 bg-black/10 hover:bg-black/20 transition-colors" />
                                    <button onClick={(e) => { e.stopPropagation(); setPersonImage(null); }} className="absolute top-2 right-2 bg-white/90 rounded-full p-2 text-red-500 shadow-lg hover:scale-110 transition-transform z-10">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                                        Нажмите, чтобы изменить
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-xl">📸</span>
                                    </div>
                                    <span className="font-bold text-gray-600 text-sm block">Загрузить фото</span>
                                    <span className="text-[10px] text-gray-400 block mt-1">JPG, PNG (до 5 МБ)</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={ALLOWED_TYPES.join(',')} className="hidden" disabled={loading} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shrink-0 safe-area-bottom z-30">
                <button 
                    disabled={!personImage || loading || isLimitReached} 
                    onClick={onStart} 
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                    ${personImage && !loading 
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-pink-500/30 hover:shadow-pink-500/50' 
                        : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-70'}`}
                >
                    {loading ? 'Обработка...' : '✨ Примерить сейчас'}
                </button>
            </div>
        </div>
    );
}