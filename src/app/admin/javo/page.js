'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

// 🛠️ СЛОВАРЬ КАТЕГОРИЙ
// label: Что видит админ и клиент
// value: Что сохраняется как категория товара
// aiType: Что отправляется в нейросеть (dresses | upper_body | lower_body)
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
  // Основные поля
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
  // Категории
  const [category, setCategory] = useState(CLOTHING_CATEGORIES[0].value); // Выбранное значение
  const [aiCategory, setAiCategory] = useState(CLOTHING_CATEGORIES[0].aiType); // Тип для нейросети
  
  const [type, setType] = useState('product');
  const [material, setMaterial] = useState('');
  const [sizes, setSizes] = useState('');
  const [details, setDetails] = useState('');
  
  // Изображения
  const [image, setImage] = useState(''); // Главное фото (для каталога)
  const [imageLarge, setImageLarge] = useState(''); 
  const [additionalImages, setAdditionalImages] = useState([]); 
  const [tryOnImage, setTryOnImage] = useState(''); // ✨ НОВОЕ: Фото специально для примерки

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const router = useRouter();

  // Проверка авторизации
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

  // Загрузка товаров
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError('Ошибка загрузки товаров');
    }
  };

  // 🧠 Умная смена категории
  const handleCategoryChange = (e) => {
    const selectedValue = e.target.value;
    setCategory(selectedValue);
    
    // Автоматически находим нужный тип для ИИ
    const found = CLOTHING_CATEGORIES.find(c => c.value === selectedValue);
    if (found) {
      setAiCategory(found.aiType);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Если нет специального фото для примерки, используем основное
    const finalTryOnImage = tryOnImage || image;

    const productData = {
      name, description, price, 
      category, 
      aiCategory, // ✨ Сохраняем в базу (dresses/upper_body/lower_body)
      type, material, sizes, details,
      image, imageLarge, additionalImages,
      tryOnImage: finalTryOnImage // ✨ Сохраняем фото для примерки
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!res.ok) throw new Error('Failed to save product');
      setSuccess(editingId ? 'Товар обновлён' : 'Товар добавлен');
      fetchProducts();
      resetForm();
    } catch (err) {
      setError('Ошибка сохранения. Проверьте консоль.');
      console.error(err);
    }
  };

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
    setTryOnImage(product.tryOnImage || ''); // Загружаем фото примерки
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить товар?')) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        setSuccess('Товар удалён');
        fetchProducts();
      } catch (err) {
        setError('Ошибка удаления');
      }
    }
  };

  const resetForm = () => {
    setName(''); setDescription(''); setPrice(''); 
    setCategory(CLOTHING_CATEGORIES[0].value); setAiCategory(CLOTHING_CATEGORIES[0].aiType);
    setType('product'); setMaterial(''); setSizes(''); setDetails('');
    setImage(''); setImageLarge(''); setAdditionalImages([]); setTryOnImage('');
    setEditingId(null);
  };

  const getImageUrl = (img) => {
    if (!img) return '/images/placeholder.jpg';
    return img.startsWith('http') ? img : `/api/images/${img}`;
  };

  if (!user) return <div className="p-10 text-center">Загрузка панели...</div>;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Управление товарами (PARIZOD)</h1>
        <Link href="/admin" className="text-pink-600 hover:underline font-medium">
          ← В меню
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100">
        
        {/* БЛОК 1: Основная инфа */}
        <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">📦 Основные данные</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Название товара" value={name} onChange={e => setName(e.target.value)} className="p-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-pink-500 outline-none" required />
                <input type="number" placeholder="Цена (Сомони/Руб)" value={price} onChange={e => setPrice(e.target.value)} className="p-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>
             <textarea placeholder="Описание товара..." value={description} onChange={e => setDescription(e.target.value)} className="p-3 border border-gray-300 rounded-xl w-full h-32 focus:ring-2 focus:ring-pink-500 outline-none" required />
        </div>

        {/* БЛОК 2: Категории и Свойства */}
        <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">🏷️ Категория (Важно для ИИ!)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Умный селект категорий */}
                <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1 ml-1">Выберите точную категорию:</label>
                    <select value={category} onChange={handleCategoryChange} className="p-3 border border-gray-300 rounded-xl w-full bg-white focus:ring-2 focus:ring-pink-500 outline-none cursor-pointer">
                        {CLOTHING_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                    {/* Подсказка, какой режим включится для нейросети */}
                    <p className="text-[10px] text-gray-400 mt-1 ml-1">
                        Режим примерки: <span className="font-mono text-pink-600 font-bold">{aiCategory}</span>
                    </p>
                </div>

                <div className="flex flex-col">
                     <label className="text-xs text-gray-500 mb-1 ml-1">Тип страницы:</label>
                     <select value={type} onChange={e => setType(e.target.value)} className="p-3 border border-gray-300 rounded-xl w-full bg-white">
                        <option value="product">Товар</option>
                        <option value="collection">Коллекция</option>
                        <option value="look">Лукбук</option>
                    </select>
                </div>

                <input type="text" placeholder="Материал" value={material} onChange={e => setMaterial(e.target.value)} className="p-3 border border-gray-300 rounded-xl w-full" />
                <input type="text" placeholder="Размеры (S, M, L, XL)" value={sizes} onChange={e => setSizes(e.target.value)} className="p-3 border border-gray-300 rounded-xl w-full" />
            </div>
        </div>

        {/* БЛОК 3: Фотографии */}
        <div className="col-span-1 md:col-span-2 border-t pt-6 mt-2">
            <h3 className="text-lg font-bold text-gray-700 mb-4">📸 Изображения</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Левая колонка: Обычные фото */}
                <div className="space-y-4 border-r pr-4">
                    <p className="font-semibold text-sm text-gray-600 bg-gray-100 p-2 rounded">Для каталога (На модели)</p>
                    
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">Главное фото:</span>
                        <ImageUpload onUpload={(url) => setImage(url)} label="Загрузить основное" />
                        {image && <div className="mt-2 relative h-20 w-20"><Image src={getImageUrl(image)} alt="Main" fill className="object-cover rounded-lg border"/></div>}
                    </div>
                    
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">Галерея (доп. фото):</span>
                        <ImageUpload onUpload={(urls) => setAdditionalImages(prev => [...prev, ...urls])} multiple={true} label="+ Добавить фото" />
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {additionalImages.map((img, idx) => (
                                <div key={idx} className="relative h-12 w-12"><Image src={getImageUrl(img)} alt="Add" fill className="object-cover rounded border"/></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Правая колонка: ТЕХНИЧЕСКОЕ ФОТО */}
                <div className="space-y-4 bg-pink-50 p-4 rounded-xl border border-pink-100">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <p className="font-bold text-sm text-pink-700">Для Virtual Try-On (Примерка)</p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Загрузите фото одежды <b>на белом фоне</b> или <b>на манекене</b>. 
                        Без лица, без рук, без лишних предметов.
                        <br/><i>Если не загрузить, используется главное фото.</i>
                    </p>

                    <div>
                        <ImageUpload onUpload={(url) => setTryOnImage(url)} label="Загрузить тех. фото" />
                        {tryOnImage ? (
                             <div className="mt-3 relative h-40 w-full bg-white rounded-lg border border-pink-200 overflow-hidden group">
                                <Image src={getImageUrl(tryOnImage)} alt="TryOn" fill className="object-contain"/>
                                <button type="button" onClick={() => setTryOnImage('')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">✕</button>
                             </div>
                        ) : (
                            <div className="mt-3 h-40 w-full border-2 border-dashed border-pink-200 rounded-lg flex items-center justify-center text-pink-300 text-sm">
                                Нет тех. фото
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Кнопки */}
        <div className="col-span-1 md:col-span-2 flex gap-4 mt-6">
            <button type="submit" className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg px-8 py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition flex-1">
            {editingId ? '💾 Сохранить изменения' : '🚀 Создать товар'}
            </button>
            {editingId && (
            <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-300 transition">
                Отмена
            </button>
            )}
        </div>

        {/* Сообщения */}
        {error && <div className="col-span-1 md:col-span-2 p-4 bg-red-100 text-red-700 rounded-xl text-center font-medium animate-pulse">{error}</div>}
        {success && <div className="col-span-1 md:col-span-2 p-4 bg-green-100 text-green-700 rounded-xl text-center font-medium">{success}</div>}
      </form>

      {/* Список товаров */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-700 mt-10 mb-4">Список товаров</h2>
        {products.map((product) => (
          <div key={product._id} className="p-5 border border-gray-100 rounded-2xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition">
            <div className="flex gap-5 items-center">
                <div className="w-20 h-24 relative flex-shrink-0">
                     <Image
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        fill
                        className="object-cover rounded-lg"
                    />
                    {/* Индикатор наличия Try-On фото */}
                    {product.tryOnImage && (
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">AI Ready</span>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{product.price} TJS</p>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{product.category}</span>
                        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded font-bold">{product.aiCategory || 'auto'}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleEdit(product)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition">Ред.</button>
              <button onClick={() => handleDelete(product._id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
