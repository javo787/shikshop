'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase'; 
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ImageUpload from '../../../components/ImageUpload';

// 🛠️ КОНФИГУРАЦИЯ КАТЕГОРИЙ
const CLOTHING_CATEGORIES = [
  { label: '👗 Длинное платье', value: 'long_dress', aiType: 'dresses' },
  { label: '👗 Короткое платье', value: 'short_dress', aiType: 'dresses' },
  { label: '🧥 Пальто / Тренч', value: 'coat', aiType: 'dresses' }, 
  { label: '🧥 Шуба (Длинная)', value: 'fur_coat_long', aiType: 'dresses' },
  { label: '🧥 Шуба (Короткая / Автоледи)', value: 'fur_coat_short', aiType: 'upper_body' },
  { label: '🧥 Пуховик (Длинный)', value: 'puffer_long', aiType: 'dresses' },
  { label: '🧥 Пуховик / Куртка (Короткие)', value: 'jacket', aiType: 'upper_body' },
  { label: '👔 Пиджак / Жакет', value: 'blazer', aiType: 'upper_body' },
  { label: '👕 Блузка / Рубашка', value: 'shirt', aiType: 'upper_body' },
  { label: '👘 Костюм (Цельный/Комбинезон)', value: 'jumpsuit', aiType: 'dresses' },
  { label: '👖 Юбка', value: 'skirt', aiType: 'lower_body' },
  { label: '👖 Брюки / Джинсы', value: 'pants', aiType: 'lower_body' },
];

export default function AdminProducts() {
  // --- STATE: Основные данные ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
  // --- STATE: Категории ---
  const [category, setCategory] = useState(CLOTHING_CATEGORIES[0].value);
  const [aiCategory, setAiCategory] = useState(CLOTHING_CATEGORIES[0].aiType);
  
  // --- STATE: Детали ---
  const [type, setType] = useState('product');
  const [material, setMaterial] = useState('');
  const [sizes, setSizes] = useState('');
  const [details, setDetails] = useState('');
  
  // --- STATE: Изображения ---
  const [image, setImage] = useState(''); // Главное (для каталога)
  const [imageLarge, setImageLarge] = useState(''); 
  const [additionalImages, setAdditionalImages] = useState([]); 
  
  // 🔥 STATE: AI Изображения
  const [tryOnImages, setTryOnImages] = useState([]); 

  // --- STATE: Системные ---
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  
  // 🔥 STATE: Генерация AI
  const [isGenerating, setIsGenerating] = useState(false);
  
  const router = useRouter();

  // --- ЭФФЕКТЫ ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/admin');
      } else {
        setUser(currentUser);
        fetchProducts();
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- ЗАГРУЗКА ДАННЫХ ---
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError('Ошибка загрузки списка товаров');
    }
  };

  // --- ЛОГИКА ---
  const handleCategoryChange = (e) => {
    const selectedValue = e.target.value;
    setCategory(selectedValue);
    const found = CLOTHING_CATEGORIES.find(c => c.value === selectedValue);
    if (found) {
      setAiCategory(found.aiType);
    }
  };

  const addImageToArray = (url, setter) => {
    if (url) setter(prev => [...prev, url]);
  };
  
  const removeImageFromArray = (index, setter) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const getImageUrl = (img) => {
    if (!img) return '/images/placeholder.jpg';
    return img.startsWith('http') ? img : `/api/images/${img}`;
  };

  // 🔥 ФУНКЦИЯ ГЕНЕРАЦИИ ЧЕРЕЗ AI (GEMINI)
  const handleGenerateAI = async () => {
    if (!image) {
        alert("Сначала загрузите главное фото (обложку)!");
        return;
    }

    try {
        setIsGenerating(true);
        setError(null);

        // 1. Конвертируем URL картинки в Base64
        const imageUrl = getImageUrl(image);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });

        // 2. Собираем то, что вы уже написали в поля (контекст для AI)
        const currentData = {
            name,
            description,
            material,
            details // если есть детали, тоже отправим
        };

        // 3. Отправляем в API
        const res = await fetch('/api/admin/generate-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, currentData }),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Ошибка генерации');
        }
        
        const data = await res.json();

        // 4. Заполняем поля ответом от AI
        if (data.name) setName(data.name);
        if (data.description) setDescription(data.description);
        if (data.material) setMaterial(data.material);
        if (data.details) setDetails(data.details);
        
        // Если AI уверенно определил категорию, меняем её
        if (data.category) {
             const found = CLOTHING_CATEGORIES.find(c => c.value === data.category);
             if (found) {
                 setCategory(found.value);
                 setAiCategory(found.aiType);
             }
        } else if (data.aiCategory) {
             setAiCategory(data.aiCategory);
        }
        
        setSuccess("✨ Данные успешно сгенерированы AI!");
        setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
        console.error(err);
        setError("Не удалось сгенерировать описание. Проверьте консоль.");
    } finally {
        setIsGenerating(false);
    }
  };

  // --- СОХРАНЕНИЕ ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Важно: берем первое фото из массива для совместимости со старыми версиями
    const primaryTryOn = tryOnImages.length > 0 ? tryOnImages[0] : image;

    const productData = {
      name, description, price, 
      category, aiCategory,
      type, material, sizes, details,
      image, imageLarge, 
      additionalImages, 
      tryOnImages,      
      tryOnImage: primaryTryOn 
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      setSuccess(editingId ? '✅ Товар успешно обновлён' : '✅ Товар успешно создан');
      fetchProducts();
      
      if (!editingId) resetForm(); 
      else window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      setError('Ошибка при сохранении товара');
      console.error(err);
    }
  };

  // --- РЕДАКТИРОВАНИЕ ---
  const handleEdit = (product) => {
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price || '');
    setCategory(product.category || CLOTHING_CATEGORIES[0].value);
    setAiCategory(product.aiCategory || CLOTHING_CATEGORIES[0].aiType);
    setType(product.type || 'product');
    setMaterial(product.material || '');
    setSizes(product.sizes || '');
    setDetails(product.details || '');
    setEditingId(product._id);
    setImage(product.image || '');
    setImageLarge(product.imageLarge || '');
    setAdditionalImages(product.additionalImages || []);
    
    // Миграция старых данных: если есть только tryOnImage, превращаем его в массив
    if (product.tryOnImages && product.tryOnImages.length > 0) {
        setTryOnImages(product.tryOnImages);
    } else if (product.tryOnImage) {
        setTryOnImages([product.tryOnImage]);
    } else {
        setTryOnImages([]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        setSuccess('Товар удалён');
        fetchProducts();
      } catch (err) {
        setError('Не удалось удалить товар');
      }
    }
  };

  const resetForm = () => {
    setName(''); setDescription(''); setPrice(''); 
    setCategory(CLOTHING_CATEGORIES[0].value); 
    setAiCategory(CLOTHING_CATEGORIES[0].aiType);
    setType('product'); setMaterial(''); setSizes(''); setDetails('');
    setImage(''); setImageLarge(''); 
    setAdditionalImages([]); 
    setTryOnImages([]);
    setEditingId(null);
    setSuccess(null);
    setError(null);
  };

  if (!user) return <div className="p-10 text-center text-gray-500">Загрузка панели администратора...</div>;

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Управление товарами (PARIZOD)</h1>
        <Link href="/admin" className="text-pink-600 hover:underline font-medium flex items-center gap-1">
           <span>←</span> В меню
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100">
        
        {/* 1. Блок основных данных */}
        <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex justify-between items-end border-b pb-2">
                <h3 className="text-lg font-bold text-gray-700">📦 Основная информация</h3>
                {/* 🔥 КНОПКА AI ГЕНЕРАЦИИ */}
                <button 
                    type="button" 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !image}
                    className={`text-sm px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm
                        ${isGenerating 
                            ? 'bg-gray-100 text-gray-400 cursor-wait' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                        }`}
                >
                    {isGenerating ? (
                        <><span className="animate-spin">⏳</span> Анализирую...</>
                    ) : (
                        <>✨ AI Автозаполнение</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 ml-1">Название товара</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Например: Вечернее платье" className="p-3 border rounded-xl w-full focus:ring-2 focus:ring-pink-200 outline-none" required />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 ml-1">Цена (TJS)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="p-3 border rounded-xl w-full focus:ring-2 focus:ring-pink-200 outline-none" />
                </div>
            </div>
            <div className="space-y-1">
                 <label className="text-xs text-gray-500 ml-1">Описание (Можно написать подсказки для AI сюда)</label>
                 <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Например: Снимающиеся рукава, для свадьбы..." className="p-3 border rounded-xl w-full h-32 focus:ring-2 focus:ring-pink-200 outline-none resize-none" required />
            </div>
        </div>

        {/* 2. Блок категорий и характеристик */}
        <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2 flex items-center gap-2">🏷️ Характеристики и AI</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Категория:</label>
                    <select value={category} onChange={handleCategoryChange} className="p-3 border rounded-xl w-full bg-white focus:ring-2 focus:ring-pink-200 outline-none cursor-pointer">
                        {CLOTHING_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2 mt-2 bg-pink-50 p-2 rounded-lg border border-pink-100">
                         <span className="text-lg">🤖</span>
                         <p className="text-xs text-gray-600">Алгоритм примерки: <span className="font-bold text-pink-600 uppercase">{aiCategory}</span></p>
                    </div>
                </div>
                <div className="space-y-3">
                     <div>
                        <label className="text-xs text-gray-500 block mb-1">Тип страницы:</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="p-3 border rounded-xl w-full bg-white focus:ring-2 focus:ring-pink-200 outline-none">
                            <option value="product">Товар (Product)</option>
                            <option value="collection">Коллекция (Collection)</option>
                            <option value="look">Лукбук (Lookbook)</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Материал (подсказка для AI)" value={material} onChange={e => setMaterial(e.target.value)} className="p-3 border rounded-xl w-full text-sm" />
                        <input type="text" placeholder="Размеры (S, M)" value={sizes} onChange={e => setSizes(e.target.value)} className="p-3 border rounded-xl w-full text-sm" />
                     </div>
                </div>
            </div>
        </div>

        {/* 3. Блок изображений */}
        <div className="col-span-1 md:col-span-2 border-t pt-6 mt-2">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">📸 Медиа и Визуал</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Левая колонка: Обычные фото */}
                <div className="space-y-6 border-r pr-4 md:border-r-0 md:border-b-0 border-gray-100">
                    {/* Обложка */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="font-bold text-sm text-gray-800 mb-2 flex justify-between">
                            1. Обложка товара
                            <span className="text-xs font-normal text-gray-400">Сначала загрузите это!</span>
                        </p>
                        <div className="flex items-start gap-4">
                             <div className="flex-1">
                                <ImageUpload onUpload={(url) => setImage(url)} label="Загрузить фото" />
                             </div>
                             {image && (
                                <div className="relative h-24 w-20 border rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                                    <Image src={getImageUrl(image)} alt="Cover" fill className="object-cover"/>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Галерея */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="font-bold text-sm text-gray-800 mb-2 flex justify-between">
                            2. Галерея
                            <span className="text-xs font-normal text-gray-400">Слайдер</span>
                        </p>
                        <ImageUpload onUpload={(url) => addImageToArray(url, setAdditionalImages)} label="+ Добавить в галерею" />
                        
                        {additionalImages.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {additionalImages.map((img, idx) => (
                                    <div key={idx} className="relative w-16 h-16 border rounded-lg overflow-hidden group shadow-sm bg-white">
                                        <Image src={getImageUrl(img)} alt={`Gallery ${idx}`} fill className="object-cover"/>
                                        <button type="button" onClick={() => removeImageFromArray(idx, setAdditionalImages)} className="absolute top-0 right-0 bg-red-500/90 text-white w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Правая колонка: AI фото */}
                <div className="space-y-4 bg-gradient-to-br from-pink-50 to-purple-50 p-5 rounded-2xl border border-pink-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
                    
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <span className="text-2xl bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm">✨</span>
                        <div>
                            <p className="font-bold text-sm text-gray-800">Virtual Try-On (AI)</p>
                            <p className="text-[11px] text-gray-500 leading-tight">Фото на манекене/вешалке. <br/>Загрузите несколько цветов, если есть.</p>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <ImageUpload onUpload={(url) => addImageToArray(url, setTryOnImages)} label="+ Добавить вариант (AI)" />
                    </div>

                    {tryOnImages.length > 0 ? (
                        <div className="mt-3 grid grid-cols-3 gap-2 relative z-10">
                            {tryOnImages.map((img, idx) => (
                                <div key={idx} className="relative h-24 bg-white rounded-lg border border-pink-200 overflow-hidden group shadow-sm">
                                    <Image src={getImageUrl(img)} alt={`TryOn ${idx}`} fill className="object-contain p-1"/>
                                    <button type="button" onClick={() => removeImageFromArray(idx, setTryOnImages)} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shadow opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center p-0.5 backdrop-blur-[2px]">Вар. {idx + 1}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2 p-3 bg-white/60 rounded-lg border border-pink-100 text-center relative z-10">
                            <p className="text-xs text-gray-400 italic">Нет специальных фото.<br/>AI попробует использовать обложку.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Кнопки действий */}
        <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-4 mt-6 pt-6 border-t">
            <button type="submit" className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95 flex-1 md:flex-none md:w-2/3">
            {editingId ? '💾 Сохранить изменения' : '🚀 Создать товар'}
            </button>
            
            {editingId && (
            <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-600 font-semibold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors flex-1 md:flex-none">
                Отменить
            </button>
            )}
        </div>

        {/* Сообщения о статусе */}
        {error && (
            <div className="col-span-1 md:col-span-2 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2 animate-fadeIn">
                <span>⚠️</span> {error}
            </div>
        )}
        {success && (
            <div className="col-span-1 md:col-span-2 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl flex items-center gap-2 animate-fadeIn">
                <span>✅</span> {success}
            </div>
        )}
      </form>

      {/* Список товаров */}
      <div className="space-y-4 pb-20">
        <h2 className="text-xl font-bold text-gray-800 mt-12 mb-6 border-l-4 border-pink-500 pl-3">Ваши товары</h2>
        {products.map((product) => {
            const aiCount = product.tryOnImages?.length || (product.tryOnImage ? 1 : 0);
            return (
              <div key={product._id} className="p-4 border border-gray-100 rounded-2xl flex flex-col sm:flex-row justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow gap-4">
                <div className="flex gap-4 items-center w-full sm:w-auto">
                    <div className="w-16 h-16 relative shrink-0">
                         <Image src={getImageUrl(product.image)} alt={product.name} fill className="object-cover rounded-lg border border-gray-200" />
                         {aiCount > 0 && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-white">
                                {aiCount}
                            </div>
                         )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{product.name}</h3>
                        <div className="flex flex-wrap gap-2 text-xs mt-1.5">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{product.category}</span>
                            <span className="bg-gray-50 text-gray-400 px-2 py-0.5 rounded border border-gray-200">{product.price ? `${product.price} TJS` : 'Нет цены'}</span>
                            {aiCount > 0 && <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded font-bold border border-pink-100">AI Ready</span>}
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => handleEdit(product)} className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-medium transition-colors text-sm">
                    ✏️ Ред.
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors text-sm">
                    🗑️ Удал.
                  </button>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
}
