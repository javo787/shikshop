'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase.js';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ImageUpload from '../../../components/ImageUpload'; // Импорт компонента

export default function AdminProducts() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('product');
  const [material, setMaterial] = useState('');
  const [sizes, setSizes] = useState('');
  const [details, setDetails] = useState('');
  const [image, setImage] = useState(''); // Теперь URL
  const [imageLarge, setImageLarge] = useState(''); // URL
  const [additionalImages, setAdditionalImages] = useState([]); // Массив URL
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
    const productData = {
      name,
      description,
      price,
      category,
      type,
      material,
      sizes,
      details,
      image,
      imageLarge,
      additionalImages,
    }; // Отправляем URL вместо файлов

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' }, // Теперь JSON, не FormData
        body: JSON.stringify(productData),
      });
      if (!res.ok) throw new Error('Failed to save product');
      setSuccess(editingId ? 'Товар обновлён' : 'Товар добавлен');
      setError(null);
      fetchProducts();
      resetForm();
    } catch (err) {
      setError('Ошибка сохранения');
      setSuccess(null);
    }
  };

  const handleEdit = (product) => {
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price || '');
    setCategory(product.category || '');
    setType(product.type);
    setMaterial(product.material || '');
    setSizes(product.sizes || '');
    setDetails(product.details || '');
    setEditingId(product._id);
    setImage(product.image || '');
    setImageLarge(product.imageLarge || '');
    setAdditionalImages(product.additionalImages || []);
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить товар?')) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        setSuccess('Товар удалён');
        setError(null);
        fetchProducts();
      } catch (err) {
        setError('Ошибка удаления');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setType('product');
    setMaterial('');
    setSizes('');
    setDetails('');
    setImage('');
    setImageLarge('');
    setAdditionalImages([]);
    setEditingId(null);
  };

  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Управление товарами</h1>
      <Link href="/admin" className="text-accent-rose hover:underline mb-4 inline-block">
        ← Назад в админ-панель
      </Link>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <input
          type="text"
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <textarea
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Цена"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 border rounded"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="product">Товар</option>
          <option value="collection">Коллекция</option>
          <option value="look">Лукбук</option>
        </select>
        <input
          type="text"
          placeholder="Материал"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Размеры (например, S, M, L)"
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
          className="p-2 border rounded"
        />
        <textarea
          placeholder="Детали"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="p-2 border rounded"
        />
        <div>
          <label>Основное изображение:</label>
          <ImageUpload onUpload={(url) => setImage(url)} /> {/* Для image */}
          {image && <p>Ссылка: {image}</p>}
        </div>
        <div>
          <label>Большое изображение:</label>
          <ImageUpload onUpload={(url) => setImageLarge(url)} /> {/* Для imageLarge */}
          {imageLarge && <p>Ссылка: {imageLarge}</p>}
        </div>
        <div>
          <label>Дополнительные изображения:</label>
          <ImageUpload onUpload={(urls) => setAdditionalImages(urls)} multiple={true} /> {/* Multiple */}
          {additionalImages.length > 0 && <p>Ссылки: {additionalImages.join(', ')}</p>}
        </div>
        <button type="submit" className="bg-accent-rose text-text-light px-4 py-2 rounded">
          {editingId ? 'Обновить' : 'Добавить'}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="bg-neutral-gray text-text-dark px-4 py-2 rounded">
            Отмена
          </button>
        )}
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
      </form>

      <h2 className="text-2xl font-semibold mb-4">Список товаров</h2>
      <div className="grid grid-cols-1 gap-4">
  {products.map((product) => (
    <div key={product._id} className="p-4 border rounded">
      <h3 className="text-xl font-medium">{product.name}</h3>
      <p>{product.description}</p>
      <p>Цена: {product.price || 'N/A'} ₽</p>
      <p>Тип: {product.type}</p>
      {product.image && (
        <Image
          src={product.image.startsWith('http') ? product.image : `/api/images/${product.image}`} // Проверка для совместимости
          alt={product.name}
          width={128}
          height={128}
          className="object-cover"
        />
      )}
      <button onClick={() => handleEdit(product)} className="bg-primary-pink text-text-light px-2 py-1 rounded mr-2">
        Редактировать
      </button>
      <button onClick={() => handleDelete(product._id)} className="bg-red-500 text-text-light px-2 py-1 rounded">
        Удалить
      </button>
     </div>
       ))}
    </div>

    </div>
  );
}