// src/components/TryOn/PhotoValidationModal.js
import { useState } from 'react';
import Image from 'next/image';
import { VALIDATION_CHECKLIST } from './utils';

export default function PhotoValidationModal({ isOpen, onClose, onConfirm, imageSrc, brightnessWarning }) {
  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-5 text-center border-b border-gray-100 dark:border-gray-800">
             <h3 className="text-xl font-bold text-gray-800 dark:text-white">📸 Проверка фото</h3>
             <p className="text-xs text-gray-500 mt-1">Хорошее фото = Хороший результат</p>
        </div>

        <div className="overflow-y-auto p-5">
            {/* Ваше фото (Миниатюра) */}
            <div className="flex justify-center mb-6">
                <div className="w-32 h-44 relative rounded-xl overflow-hidden shadow-md border-2 border-white dark:border-gray-700">
                    <Image src={imageSrc} alt="Preview" fill className="object-cover" unoptimized />
                    {brightnessWarning && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2">
                             <span className="text-white text-xs font-bold text-center">⚠️ {brightnessWarning}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Визуальные карточки (вместо чекбоксов) */}
            <p className="text-center font-bold text-sm mb-3">Похоже на ваше фото?</p>
            <div className="grid grid-cols-3 gap-2">
                {VALIDATION_CHECKLIST.map((item) => (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex flex-col items-center text-center border border-gray-100 dark:border-gray-700">
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.label}</div>
                        <div className="text-[10px] text-gray-400 leading-tight mt-1">{item.desc}</div>
                    </div>
                ))}
            </div>

            {brightnessWarning && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center border border-red-100 animate-pulse">
                    ⚠ Ой! Фото темное или засвечено. Попробуйте другое.
                </div>
            )}
        </div>

        {/* Кнопки */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 text-sm">
                Выбрать другое
            </button>
            <button 
                onClick={onConfirm}
                // Если есть предупреждение по свету - не даем продолжить (или даем на страх пользователя)
                className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-pink-500/30 text-sm"
            >
                Всё супер, шьём!
            </button>
        </div>
      </div>
    </div>
  );
}