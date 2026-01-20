'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
<<<<<<< HEAD
=======
// Используем относительный путь, как в старом файле, для надежности
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
import { auth } from '../../../lib/firebase'; 
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
// Используем относительный путь к компонентам
import ImageUpload from '../../../components/ImageUpload';

<<<<<<< HEAD
// 🛠️ КОНФИГУРАЦИЯ КАТЕГОРИЙ
=======
// 🛠️ СЛОВАРЬ КАТЕГОРИЙ ДЛЯ AI
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
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
<<<<<<< HEAD
  // --- STATE: Основные данные ---
=======
  // --- STATE ---
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
<<<<<<< HEAD
  // --- STATE: Категории ---
  const [category, setCategory] = useState(CLOTHING_CATEGORIES[0].value);
  const [aiCategory, setAiCategory] = useState(CLOTHING_CATEGORIES[0].aiType);
  
  // --- STATE: Детали ---
=======
  // Категории (умные)
  const [category, setCategory] = useState(CLOTHING_CATEGORIES[0].value);
  const [aiCategory, setAiCategory] = useState(CLOTHING_CATEGORIES[0].aiType);
  
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
  const [type, setType] = useState('product');
  const [material, setMaterial] = useState('');
  const [sizes, setSizes] = useState('');
  const [details, setDetails] = useState('');
  
<<<<<<< HEAD
  // --- STATE: Изображения ---
  const [image, setImage] = useState(''); // Главное (для каталога)
  const [imageLarge, setImageLarge] = useState(''); // Большое (если отличается)
  const [additionalImages, setAdditionalImages] = useState([]); // Галерея (массив)
  
  // 🔥 STATE: AI Изображения (Массив вариантов/цветов)
  const [tryOnImages, setTryOnImages] = useState([]); 

  // --- STATE: Системные ---
=======
  // Изображения
  const [image, setImage] = useState(''); 
  const [imageLarge, setImageLarge] = useState(''); 
  const [additionalImages, setAdditionalImages] = useState([]); 
  const [tryOnImage, setTryOnImage] = useState(''); // 🔥 Новое поле

>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  
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

<<<<<<< HEAD
  // --- ЗАГРУЗКА ДАННЫХ ---
=======
  // --- ФУНКЦИИ ---
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
<<<<<<< HEAD
      setError('Ошибка загрузки списка товаров');
=======
      setError('Ошибка загрузки товаров');
    }
  };

  const handleCategoryChange = (e) => {
    const selectedValue = e.target.value;
    setCategory(selectedValue);
    const found = CLOTHING_CATEGORIES.find(c => c.value === selectedValue);
    if (found) {
      setAiCategory(found.aiType);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const finalTryOnImage = tryOnImage || image;

    const productData = {
      name, description, price, 
      category, aiCategory, // Сохраняем категорию для AI
      type, material, sizes, details,
      image, imageLarge, additionalImages,
      tryOnImage: finalTryOnImage // Сохраняем фото для примерки
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
      setSuccess(editingId ? 'Товар обновлён' : 'Товар добавлен');
      fetchProducts();
      resetForm();
    } catch (err) {
      setError('Ошибка сохранения');
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
      console.error(err);
    }
  };

<<<<<<< HEAD
  // --- ЛОГИКА ---
  const handleCategoryChange = (e) => {
    const selectedValue = e.target.value;
    setCategory(selectedValue);
    // Автоматический выбор типа одежды для нейросети
    const found = CLOTHING_CATEGORIES.find(c => c.value === selectedValue);
    if (found) {
      setAiCategory(found.aiType);
    }
  };

  // Хелперы для массивов изображений
  const addImageToArray = (url, setter) => {
    if (url) setter(prev => [...prev, url]);
  };
  
  const removeImageFromArray = (index, setter) => {
    setter(prev => prev.filter((_, i) => i !== index));
=======
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
    setTryOnImage(product.tryOnImage || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить товар?')) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        setSuccess('Товар удалён');
        fetchProducts();
      } catch (err) {
        setError('Ошибка удаления');
      }
    }
  };

  const resetForm = () => {
    setName(''); setDescription(''); setPrice(''); 
    setCategory(CLOTHING_CATEGORIES[0].value); 
    setAiCategory(CLOTHING_CATEGORIES[0].aiType);
    setType('product'); setMaterial(''); setSizes(''); setDetails('');
    setImage(''); setImageLarge(''); setAdditionalImages([]); setTryOnImage('');
    setEditingId(null);
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
  };

  const getImageUrl = (img) => {
    if (!img) return '/images/placeholder.jpg';
    return img.startsWith('http') ? img : `/api/images/${img}`;
  };

  // --- СОХРАНЕНИЕ ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Логика fallback:
    // 1. Для совместимости со старым кодом заполняем одиночное поле tryOnImage первым элементом массива (или главным фото)
    const primaryTryOn = tryOnImages.length > 0 ? tryOnImages[0] : image;

    const productData = {
      name, description, price, 
      category, aiCategory,
      type, material, sizes, details,
      image, imageLarge, 
      
      additionalImages, // Галерея
      tryOnImages,      // Новое поле: Массив вариантов
      tryOnImage: primaryTryOn // Старое поле: Одиночное (для совместимости)
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
      
      // Сбрасываем форму только если это создание нового товара
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
    
    // Изображения
    setImage(product.image || '');
    setImageLarge(product.imageLarge || '');
    setAdditionalImages(product.additionalImages || []);
    
    // 🔥 ВАЖНО: Миграция данных "на лету" при редактировании
    // Если есть новый массив - берем его.
    // Если нет массива, но есть старое одиночное фото - кладем его в массив.
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
<<<<<<< HEAD
        <Link href="/admin" className="text-pink-600 hover:underline font-medium flex items-center gap-1">
           <span>←</span> В меню
        </Link>
=======
        <Link href="/admin" className="text-pink-600 hover:underline font-medium">← В меню</Link>
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100">
        
<<<<<<< HEAD
        {/* 1. Блок основных данных */}
        <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2 flex items-center gap-2">📦 Основная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 ml-1">Название товара</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="p-3 border rounded-xl w-full focus:ring-2 focus:ring-pink-200 outline-none" required />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 ml-1">Цена (TJS)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="p-3 border rounded-xl w-full focus:ring-2 focus:ring-pink-200 outline-none" />
                </div>
            </div>
            <div className="space-y-1">
                 <label className="text-xs text-gray-500 ml-1">Описание</label>
                 <textarea value={description} onChange={e => setDescription(e.target.value)} className="p-3 border rounded-xl w-full h-32 focus:ring-2 focus:ring-pink-200 outline-none resize-none" required />
            </div>
        </div>

        {/* 2. Блок категорий и характеристик */}
        <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2 flex items-center gap-2">🏷️ Характеристики и AI</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Категория (Влияет на алгоритм примерки):</label>
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
                        <input type="text" placeholder="Материал" value={material} onChange={e => setMaterial(e.target.value)} className="p-3 border rounded-xl w-full text-sm" />
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
                            <span className="text-xs font-normal text-gray-400">Для каталога</span>
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
                            <span className="text-xs font-normal text-gray-400">Слайдер на странице</span>
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
=======
        {/* Основные данные */}
        <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">📦 Основные данные</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="p-3 border rounded-xl w-full" required />
                <input type="number" placeholder="Цена" value={price} onChange={e => setPrice(e.target.value)} className="p-3 border rounded-xl w-full" />
            </div>
             <textarea placeholder="Описание..." value={description} onChange={e => setDescription(e.target.value)} className="p-3 border rounded-xl w-full h-32" required />
        </div>

        {/* Категории (AI) */}
        <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">🏷️ Категория (Важно для ИИ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Выберите категорию:</label>
                    <select value={category} onChange={handleCategoryChange} className="p-3 border rounded-xl w-full bg-white">
                        {CLOTHING_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">Режим примерки: <span className="font-bold text-pink-600">{aiCategory}</span></p>
                </div>
                <div>
                     <label className="text-xs text-gray-500 block mb-1">Тип страницы:</label>
                     <select value={type} onChange={e => setType(e.target.value)} className="p-3 border rounded-xl w-full bg-white">
                        <option value="product">Товар</option>
                        <option value="collection">Коллекция</option>
                        <option value="look">Лукбук</option>
                    </select>
                </div>
                <input type="text" placeholder="Материал" value={material} onChange={e => setMaterial(e.target.value)} className="p-3 border rounded-xl w-full" />
                <input type="text" placeholder="Размеры (S, M, L)" value={sizes} onChange={e => setSizes(e.target.value)} className="p-3 border rounded-xl w-full" />
            </div>
        </div>

        {/* Изображения */}
        <div className="col-span-1 md:col-span-2 border-t pt-6 mt-2">
            <h3 className="text-lg font-bold text-gray-700 mb-4">📸 Изображения</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 border-r pr-4">
                    <p className="font-semibold text-sm text-gray-600 bg-gray-100 p-2 rounded">Каталог (На модели)</p>
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">Главное фото:</span>
                        <ImageUpload onUpload={(url) => setImage(url)} label="Загрузить основное" />
                        {image && <div className="mt-2 relative h-20 w-20"><Image src={getImageUrl(image)} alt="Main" fill className="object-cover rounded-lg border"/></div>}
                    </div>
                </div>
                <div className="space-y-4 bg-pink-50 p-4 rounded-xl border border-pink-100">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <p className="font-bold text-sm text-pink-700">Для Virtual Try-On</p>
                    </div>
                    <p className="text-xs text-gray-600">Фото на манекене (без лица).</p>
                    <div>
                        <ImageUpload onUpload={(url) => setTryOnImage(url)} label="Загрузить тех. фото" />
                        {tryOnImage && (
                             <div className="mt-3 relative h-40 w-full bg-white rounded-lg border border-pink-200 overflow-hidden">
                                <Image src={getImageUrl(tryOnImage)} alt="TryOn" fill className="object-contain"/>
                                <button type="button" onClick={() => setTryOnImage('')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">✕</button>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Кнопки */}
        <div className="col-span-1 md:col-span-2 flex gap-4 mt-6">
            <button type="submit" className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg px-8 py-3 rounded-xl hover:shadow-lg flex-1">
            {editingId ? 'Сохранить изменения' : 'Создать товар'}
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
            </button>
            
            {editingId && (
<<<<<<< HEAD
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
            // Подсчет количества AI вариантов (поддержка старой и новой версии)
            const aiCount = product.tryOnImages?.length || (product.tryOnImage ? 1 : 0);
            
            return (
              <div key={product._id} className="p-4 border border-gray-100 rounded-2xl flex flex-col sm:flex-row justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow gap-4">
                <div className="flex gap-4 items-center w-full sm:w-auto">
                    <div className="w-16 h-16 relative shrink-0">
                         <Image src={getImageUrl(product.image)} alt={product.name} fill className="object-cover rounded-lg border border-gray-200" />
                         {/* Индикатор AI */}
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
        {products.length === 0 && !error && (
            <div className="text-center py-10 text-gray-400">Список товаров пуст. Добавьте первый товар!</div>
        )}
=======
            <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-300">
                Отмена
            </button>
            )}
        </div>
        {error && <div className="col-span-1 md:col-span-2 p-4 bg-red-100 text-red-700 rounded-xl text-center">{error}</div>}
        {success && <div className="col-span-1 md:col-span-2 p-4 bg-green-100 text-green-700 rounded-xl text-center">{success}</div>}
      </form>

      {/* Список */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-700 mt-10 mb-4">Список товаров</h2>
        {products.map((product) => (
          <div key={product._id} className="p-4 border rounded-2xl flex justify-between items-center bg-white shadow-sm">
            <div className="flex gap-4 items-center">
                <div className="w-16 h-16 relative">
                     <Image src={getImageUrl(product.image)} alt={product.name} fill className="object-cover rounded-lg" />
                     {product.tryOnImage && <span className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></span>}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{product.name}</h3>
                    <div className="flex gap-2 text-xs mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{product.category}</span>
                        <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded font-bold">{product.aiCategory}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(product)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded">Ред.</button>
              <button onClick={() => handleDelete(product._id)} className="px-3 py-1 bg-red-50 text-red-600 rounded">Удал.</button>
            </div>
          </div>
        ))}
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
      </div>
    </div>
  );
}
