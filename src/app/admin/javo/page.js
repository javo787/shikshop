'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase.js';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ImageUpload from '../../../components/ImageUpload';

export default function AdminProducts() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('product');
  const [material, setMaterial] = useState('');
  const [sizes, setSizes] = useState('');
  const [details, setDetails] = useState('');
  
  // Состояния для ссылок (URL)
  const [image, setImage] = useState(''); 
  const [imageLarge, setImageLarge] = useState(''); 
  const [additionalImages, setAdditionalImages] = useState([]); 
  
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const router = useRouter();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const productData = {
      name, description, price, category, type, material, sizes, details,
      image, imageLarge, additionalImages,
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
    setCategory(product.category || '');
    setType(product.type || 'product');
    setMaterial(product.material || '');
    setSizes(product.sizes || '');
    setDetails(product.details || '');
    setEditingId(product._id);
    setImage(product.image || '');
    setImageLarge(product.imageLarge || '');
    setAdditionalImages(product.additionalImages || []);
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
    setName(''); setDescription(''); setPrice(''); setCategory('');
    setType('product'); setMaterial(''); setSizes(''); setDetails('');
    setImage(''); setImageLarge(''); setAdditionalImages([]);
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
        <h1 className="text-3xl font-bold">Управление товарами (Cloudinary)</h1>
        <Link href="/admin" className="text-accent-rose hover:underline">
          ← В меню
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="p-2 border rounded w-full" required />
        <input type="number" placeholder="Цена" value={price} onChange={e => setPrice(e.target.value)} className="p-2 border rounded w-full" />
        
        <div className="col-span-1 md:col-span-2">
             <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} className="p-2 border rounded w-full h-24" required />
        </div>

        <input type="text" placeholder="Категория" value={category} onChange={e => setCategory(e.target.value)} className="p-2 border rounded w-full" />
        <select value={type} onChange={e => setType(e.target.value)} className="p-2 border rounded w-full">
          <option value="product">Товар</option>
          <option value="collection">Коллекция</option>
          <option value="look">Лукбук</option>
        </select>

        <input type="text" placeholder="Материал" value={material} onChange={e => setMaterial(e.target.value)} className="p-2 border rounded w-full" />
        <input type="text" placeholder="Размеры (S, M, L)" value={sizes} onChange={e => setSizes(e.target.value)} className="p-2 border rounded w-full" />

        {/* Секция загрузки фото */}
        <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
            <p className="font-semibold mb-2">Изображения (загружаются в облако ☁️)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <span className="text-sm text-gray-600 block mb-1">Главное фото:</span>
                    <ImageUpload onUpload={(url) => setImage(url)} label="Загрузить основное" />
                    {image && <p className="text-xs text-green-600 mt-1 truncate">Ссылка OK</p>}
                </div>
                <div>
                    <span className="text-sm text-gray-600 block mb-1">Большое фото:</span>
                    <ImageUpload onUpload={(url) => setImageLarge(url)} label="Загрузить большое" />
                    {imageLarge && <p className="text-xs text-green-600 mt-1 truncate">Ссылка OK</p>}
                </div>
                <div>
                    <span className="text-sm text-gray-600 block mb-1">Доп. фото (несколько):</span>
                    <ImageUpload onUpload={(urls) => setAdditionalImages(prev => [...prev, ...urls])} multiple={true} label="Добавить фото" />
                    {additionalImages.length > 0 && <p className="text-xs text-green-600 mt-1">{additionalImages.length} фото загружено</p>}
                </div>
            </div>
            
            {/* Предпросмотр главного фото */}
            {image && (
                <div className="mt-4">
                    <p className="text-sm text-gray-500">Предпросмотр:</p>
                    <Image src={image} alt="Preview" width={100} height={100} className="rounded object-cover border" />
                </div>
            )}
        </div>

        <div className="col-span-1 md:col-span-2 flex gap-2 mt-4">
            <button type="submit" className="bg-accent-rose text-white px-6 py-2 rounded hover:bg-red-400 transition flex-1">
            {editingId ? 'Сохранить изменения' : 'Создать товар'}
            </button>
            {editingId && (
            <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition">
                Отмена
            </button>
            )}
        </div>

        {error && <p className="col-span-1 md:col-span-2 text-red-500 text-center">{error}</p>}
        {success && <p className="col-span-1 md:col-span-2 text-green-500 text-center">{success}</p>}
      </form>

      <div className="space-y-4">
        {products.map((product) => (
          <div key={product._id} className="p-4 border rounded flex justify-between items-center bg-white shadow-sm">
            <div className="flex gap-4 items-center">
                {product.image && (
                    <div className="w-16 h-16 relative">
                         <Image
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                        />
                    </div>
                )}
                <div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.price} ₽</p>
                </div>
            </div>
            <div>
              <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700 mr-4">Ред.</button>
              <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-700">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}