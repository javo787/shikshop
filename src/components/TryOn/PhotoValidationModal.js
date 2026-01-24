// src/components/TryOn/PhotoValidationModal.js
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { VALIDATION_CHECKLIST } from './utils';

export default function PhotoValidationModal({ isOpen, onClose, onConfirm, imageSrc, brightnessWarning }) {
  const [checkedItems, setCheckedItems] = useState({});
  const allChecked = VALIDATION_CHECKLIST.every(item => checkedItems[item.id]);

  useEffect(() => { if (isOpen) setCheckedItems({}); }, [isOpen]);
  const handleCheck = (id) => setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-slideUp border border-white/40 dark:border-gray-700 relative">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 text-center">
             <h3 className="text-xl font-bold text-gray-800 dark:text-white">📸 Проверка фото перед примеркой</h3>
             <p className="text-sm text-gray-500 mt-1">Чтобы нейросеть сработала идеально, убедитесь, что фото подходит.</p>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto max-h-[70vh]">
            <div className="w-full md:w-1/2 aspect-[3/4] relative rounded-2xl overflow-hidden shadow-md bg-gray-100 flex-shrink-0">
                <Image src={imageSrc} alt="Preview" fill className="object-cover" unoptimized />
                 {brightnessWarning && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs p-2 text-center font-bold backdrop-blur-sm">
                        {brightnessWarning}
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {brightnessWarning && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 animate-pulse">
                     <span>⚠️</span> Обнаружена проблема со светом.
                  </div>
                )}
                <p className="font-bold text-gray-700 dark:text-gray-300 mb-4 text-sm">Отметьте галочками, что это верно:</p>
                <div className="space-y-3">
                    {VALIDATION_CHECKLIST.map((item) => (
                        <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${checkedItems[item.id] ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-pink-300'}`}>
                            <div className={`relative flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${checkedItems[item.id] ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 group-hover:border-pink-400'}`}>
                                {!checkedItems[item.id] && <span className="absolute inset-0 rounded-md bg-pink-400 opacity-20 animate-ping"></span>}
                                {checkedItems[item.id] && <span className="text-xs font-bold">✓</span>}
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 leading-tight select-none">{item.label}</span>
                            <input type="checkbox" className="hidden" checked={!!checkedItems[item.id]} onChange={() => handleCheck(item.id)} />
                        </label>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-medium">Выбрать другое</button>
            <button 
                onClick={onConfirm}
                disabled={!allChecked || !!brightnessWarning}
                className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all flex items-center gap-2
                    ${allChecked && !brightnessWarning
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/40 hover:-translate-y-0.5' 
                        : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-70'}`}
            >
                Подтвердить
            </button>
        </div>
      </div>
    </div>
  );
}