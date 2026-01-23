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
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white/40 relative">
        {/* ... (код верстки тот же, что был, для краткости не дублирую полностью, суть та же) ... */}
        <div className="p-5 border-b text-center">
             <h3 className="text-xl font-bold">📸 Проверка фото</h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto max-h-[60vh]">
            <div className="w-full md:w-1/2 aspect-3/4 relative rounded-xl overflow-hidden shadow-md bg-gray-100">
                <Image src={imageSrc} alt="Preview" fill className="object-cover" unoptimized />
                 {brightnessWarning && <div className="absolute bottom-0 w-full bg-red-500/90 text-white text-xs p-2 text-center font-bold">{brightnessWarning}</div>}
            </div>
            <div className="flex-1 space-y-3">
                {VALIDATION_CHECKLIST.map((item) => (
                    <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checkedItems[item.id] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${checkedItems[item.id] ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                            {checkedItems[item.id] && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-sm">{item.label}</span>
                        <input type="checkbox" className="hidden" checked={!!checkedItems[item.id]} onChange={() => handleCheck(item.id)} />
                    </label>
                ))}
            </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-xl">Другое фото</button>
            <button onClick={onConfirm} disabled={!allChecked} className={`px-8 py-3 rounded-xl text-white font-bold transition-all ${allChecked ? 'bg-green-500 hover:scale-105' : 'bg-gray-300'}`}>Вперед</button>
        </div>
      </div>
    </div>
  );
}