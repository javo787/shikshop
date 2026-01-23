// src/components/TryOn/ResultView.js
export default function ResultView({ generatedImage, compliment, handleDownload, onRetry, remainingTries }) {
    return (
        <div className="p-6 md:p-8 flex flex-col items-center animate-slideUp h-full overflow-y-auto">
            <div className="text-center mb-4">
                <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2">{compliment}</h2>
                <p className="text-gray-500 text-sm">Готово!</p>
                {remainingTries !== null && <p className="text-xs text-gray-400 mt-1">Осталось попыток: <b>{remainingTries}</b></p>}
            </div>
            
            <div className="relative w-full max-w-md aspect-3/4 rounded-2xl overflow-hidden shadow-2xl mb-8 group ring-4 ring-pink-50 bg-gray-100">
                <img src={generatedImage} alt="Результат" className="w-full h-full object-cover"/>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button onClick={handleDownload} className="flex-1 px-8 py-4 bg-linear-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-pink-500/50 hover:-translate-y-1 transition-all">
                    Скачать фото 📥
                </button>
                <button 
                    onClick={onRetry} 
                    className="px-8 py-4 bg-white border-2 border-pink-100 text-pink-600 rounded-xl font-bold hover:bg-pink-50 transition-colors"
                >
                    Не получилось? (Еще раз) ↺
                </button>
            </div>
            
            <p className="text-[10px] text-gray-400 mt-6 text-center max-w-xs">
                Образ создан ИИ. Результат может содержать артефакты.
            </p>
        </div>
    );
}