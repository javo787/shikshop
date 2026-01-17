'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
// Используем относительный путь, как в старом файле, для надежности
import { auth } from '../../../lib/firebase'; 
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
// Используем относительный путь к компонентам
import ImageUpload from '../../../components/ImageUpload';

// 🛠️ СЛОВАРЬ КАТЕГОРИЙ ДЛЯ AI
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
  // --- STATE ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
  // Категории (умные)
  const [category, setCategory] = useState(CLOTHING_CATEGORIES[0].value);
  const [aiCategory, setAiCategory] = useState(CLOTHING_CATEGORIES[0].aiType);
  
  const [type, setType] = useState('product');
  const [material, setMaterial] = useState('');
  const [sizes, setSizes] = useState('');
  const [details, setDetails] = useState('');
  
  // Изображения
  const [image, setImage] = useState(''); 
  const [imageLarge, setImageLarge] = useState(''); 
  const [additionalImages, setAdditionalImages] = useState([]); 
  const [tryOnImage, setTryOnImage] = useState(''); // 🔥 Новое поле

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

  // --- ФУНКЦИИ ---
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
        <Link href="/admin" className="text-pink-600 hover:underline font-medium">← В меню</Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100">
        
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
            </button>
            {editingId && (
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
      </div>
    </div>
  );
}
