import { LOADING_STEPS } from './utils';

export default function ProcessingView({ loadingStepIndex, progress }) {
    // Берем текущий шаг из массива (чтобы текст и эмодзи менялись)
    const currentStep = LOADING_STEPS[loadingStepIndex] || LOADING_STEPS[0];

    return (
        <div className="flex flex-col items-center justify-center h-full text-center w-full max-w-md mx-auto p-6 animate-fadeIn">
            {/* Анимированный круг загрузки */}
            <div className="relative w-32 h-32 mb-8">
                {/* Серый фон круга */}
                <div className="absolute inset-0 border-8 border-gray-100 dark:border-gray-800 rounded-full"></div>
                
                {/* Крутящийся розовый ободок */}
                <div 
                    className="absolute inset-0 border-8 border-pink-600 rounded-full border-t-transparent animate-spin" 
                    style={{ animationDuration: '2s' }}
                ></div>
                
                {/* Эмодзи по центру */}
                <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce-slow">
                    {currentStep.emoji}
                </div>
            </div>

            {/* Текст статуса (например: "Сканируем фото...") */}
            <div className="h-16 flex items-center justify-center w-full">
                <h4 className="text-xl font-bold mb-6 text-gray-800 dark:text-white animate-slideUp transition-all duration-300">
                    {currentStep.text}
                </h4>
            </div>

            {/* Прогресс-бар */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden relative shadow-inner">
                <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-300 relative" 
                    style={{ width: `${Math.floor(progress)}%` }}
                >
                     {/* Эффект блика на полоске */}
                     <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>

            {/* Проценты и подсказка */}
            <div className="flex justify-between w-full mt-2 px-1">
                <p className="text-xs text-gray-400 font-mono">IDM-VTON AI</p>
                <p className="text-xs text-pink-600 font-bold font-mono">{Math.floor(progress)}%</p>
            </div>

            <p className="text-gray-400 text-sm mt-8 max-w-xs mx-auto opacity-70">
                Обычно это занимает около 40-60 секунд. <br/>
                Пожалуйста, не закрывайте окно.
            </p>
        </div>
    );
}