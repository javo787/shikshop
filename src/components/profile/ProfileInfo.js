'use client';

import { useState, useEffect } from 'react';
import ImageUpload from '@/components/ImageUpload';
import ClientImage from '@/components/ClientImage';

export default function ProfileInfo({ userData, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    image: '',
  });
  
  const [errors, setErrors] = useState({}); // Для ошибок валидации
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        image: userData.image || '',
      });
    }
  }, [userData]);

  // Функция валидации
  const validateForm = () => {
    const newErrors = {};
    
    // Телефон: должен быть +992 следом 9 цифр
    if (!/^[+]992\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Номер должен быть в формате +992XXXXXXXXX (9 цифр после +992)';
    }
    
    // Адрес: не пустой
    if (!formData.address.trim()) {
      newErrors.address = 'Адрес доставки обязателен';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true если нет ошибок
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return; // Не сохраняем если ошибки
    }
    
    setIsSaving(true);
    setMessage(null);
    
    const success = await onSave(formData);
    
    if (success) {
      setMessage({ type: 'success', text: 'Данные успешно обновлены ✨' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Ошибка при сохранении' });
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/10 animate-fadeIn">
      <h2 className="text-2xl font-serif font-bold text-dark-teal dark:text-white mb-6">Личная информация</h2>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        
        {/* Аватар */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 dark:border-gray-600">
            {formData.image ? (
              <ClientImage src={formData.image} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400 text-2xl">📷</div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-dark-teal dark:text-white mb-2">Фото профиля</p>
            <ImageUpload 
              onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))} 
              label="Загрузить новое фото"
            />
            <p className="text-xs text-gray-400 mt-2">JPG, PNG или WEBP. Макс 5MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ваше имя</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink transition-colors"
              placeholder="Как к вам обращаться?"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Телефон</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} focus:outline-none focus:border-primary-pink transition-colors`}
              placeholder="+992XXXXXXXXX"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Адрес доставки</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            rows={3}
            className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border ${errors.address ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} focus:outline-none focus:border-primary-pink transition-colors resize-none`}
            placeholder="Город, улица, дом, квартира..."
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSaving || Object.keys(errors).length > 0}
            className="btn px-8 w-full md:w-auto"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
}