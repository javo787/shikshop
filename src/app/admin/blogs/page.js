'use client';

import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import { useRouter } from 'next/navigation';

// 👇 Функция сжатия (чтобы не было ошибки 413 при отправке фото в AI)
const compressImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800; 
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = (err) => reject(err);
  });
};

export default function AdminBlogs() {
  const t = useTranslations('admin');
  const router = useRouter();
  
  // --- STATE ---
  const [blogs, setBlogs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false); // 🔥 State для AI

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '', 
    excerpt: '', 
    content: '',
    image: '',
    date: new Date().toISOString().split('T')[0],
    author: 'Admin'
  });

  // --- AUTH & FETCH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push('/admin');
      setUser(currentUser);
      if (currentUser) fetchBlogs();
    });
    return () => unsubscribe();
  }, [router]);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC ---
  const generateSlug = (text) => {
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    if (!editingId) {
        setFormData(prev => ({ ...prev, title, slug: generateSlug(title) }));
    } else {
        setFormData(prev => ({ ...prev, title }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🔥 ФУНКЦИЯ ГЕНЕРАЦИИ БЛОГА
  const handleGenerateAI = async () => {
    if (!formData.content && !formData.title && !formData.image) {
        alert("Напишите хотя бы тему в поле 'Заголовок' или 'Контент', или загрузите фото!");
        return;
    }

    try {
        setIsGeneratingAI(true);
        
        let base64 = null;
        // Если есть картинка, сжимаем её для отправки
        if (formData.image) {
            try {
                base64 = await compressImage(formData.image);
            } catch (e) {
                console.error("Ошибка с картинкой", e);
            }
        }

        // Берем тему из заголовка или контента
        const topic = formData.content || formData.title || "Опиши фото и дай модные советы";

        const res = await fetch('/api/admin/generate-blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, imageBase64: base64 }),
        });

        if (!res.ok) throw new Error('Ошибка генерации');
        
        const data = await res.json();

        // Заполняем форму данными от AI
        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            slug: data.slug || generateSlug(data.title),
            excerpt: data.excerpt || prev.excerpt,
            content: data.content || prev.content,
        }));

    } catch (error) {
        alert("Не удалось сгенерировать статью: " + error.message);
    } finally {
        setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? '/api/blogs' : '/api/blogs';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Operation failed');

      setFormData({
        title: '', slug: '', excerpt: '', content: '', image: '',
        date: new Date().toISOString().split('T')[0], author: 'Admin'
      });
      setEditingId(null);
      fetchBlogs();
      alert(editingId ? 'Блог обновлен!' : 'Блог создан!');
    } catch (error) {
      console.error('Error submitting blog:', error);
      alert('Ошибка при сохранении');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (blog) => {
    setFormData({
        title: blog.title,
        slug: blog.slug || generateSlug(blog.title),
        excerpt: blog.excerpt || '',
        content: blog.content,
        image: blog.image || '',
        date: blog.date,
        author: blog.author || 'Admin'
    });
    setEditingId(blog._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm(t('confirmDelete') || 'Вы уверены?')) return;
    try {
      await fetch('/api/blogs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Загрузка блога...</div>;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto bg-gray-50/50">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
                {t('blogsTitle')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">SEO и Контент-маркетинг</p>
        </div>
        <Link href="/admin" className="text-pink-600 font-medium hover:bg-pink-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
           <span>←</span> Назад в меню
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- ЛЕВАЯ КОЛОНКА: ФОРМА --- */}
        <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h2 className="text-xl font-bold text-gray-700">
                        {editingId ? `✏️ ${t('updateBlog')}` : `✨ ${t('createBlog')}`}
                    </h2>
                    
                    {/* 🔥 КНОПКА AI */}
                    <button 
                        type="button"
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI}
                        className={`text-sm px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm
                        ${isGeneratingAI 
                            ? 'bg-gray-100 text-gray-400 cursor-wait' 
                            : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                        }`}
                    >
                        {isGeneratingAI ? '⚡ Пишу статью...' : '✨ AI Копирайтер'}
                    </button>
                </div>

                <div className="space-y-5">
                    {/* 1. Основное инфо */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('title')}</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleTitleChange}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                placeholder="Тема статьи (например: Тренды 2026)"
                                required
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('date')}</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* 2. SEO Section */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <h3 className="text-blue-800 font-bold text-sm flex items-center gap-2">
                            🔍 SEO Настройки (Auto by AI)
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="text-xs text-blue-600 block mb-1">URL Slug</label>
                                <div className="flex items-center">
                                    <span className="text-gray-400 text-sm bg-white border border-r-0 border-gray-200 p-3 rounded-l-xl">/blog/</span>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-blue-400 outline-none text-sm font-mono text-gray-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-blue-600 block mb-1">Краткое описание (Excerpt)</label>
                                <textarea
                                    name="excerpt"
                                    value={formData.excerpt}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                                    placeholder="AI напишет здесь продающее превью..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Контент */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('content')}</label>
                        <div className="relative">
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none h-96 font-sans leading-relaxed text-gray-700"
                                placeholder="Напишите тезисы сюда и нажмите кнопку 'AI Копирайтер'..."
                                required
                            />
                            {isGeneratingAI && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                    <div className="text-purple-600 font-bold animate-pulse">🤖 AI думает и пишет...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Изображение */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('image')}</label>
                        <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 hover:border-pink-400 transition-colors">
                            <ImageUpload onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))} />
                            {formData.image && (
                                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                    ✅ Изображение загружено
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                         {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', slug: '', excerpt: '', content: '', image: '', date: '', author: 'Admin' }) }} className="px-6 py-4 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">
                                Отмена
                            </button>
                         )}
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-70"
                        >
                            {isSubmitting ? 'Сохранение...' : (editingId ? t('updateBlog') : t('createBlog'))}
                        </button>
                    </div>
                </div>
            </form>
        </div>

        {/* --- ПРАВАЯ КОЛОНКА: СПИСОК И ПРЕВЬЮ --- */}
        <div className="space-y-6">
            
            {/* Карточка Превью */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-gray-400 text-xs uppercase font-bold mb-3">Превью (Как видят клиенты)</h3>
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm group">
                    <div className="relative h-48 w-full bg-gray-100">
                        {formData.image ? (
                            <Image src={formData.image} alt="Preview" fill className="object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-300 text-4xl">📷</div>
                        )}
                    </div>
                    <div className="p-4">
                        <p className="text-xs text-pink-600 font-bold mb-1">{formData.date}</p>
                        <h4 className="font-bold text-gray-800 text-lg leading-tight mb-2 line-clamp-2">
                            {formData.title || 'Здесь будет заголовок...'}
                        </h4>
                        <p className="text-sm text-gray-500 line-clamp-3">
                            {formData.excerpt || 'Здесь появится краткое описание от AI...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Список постов */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-700">📚 Ваши статьи ({blogs.length})</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100">
                    {blogs.length === 0 && <p className="p-8 text-center text-gray-400">Пока нет записей</p>}
                    
                    {blogs.map((blog) => (
                        <div key={blog._id} className="p-4 hover:bg-pink-50 transition-colors flex gap-3 group">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border bg-gray-100">
                                {blog.image && (
                                    <Image 
                                        src={blog.image.startsWith('http') ? blog.image : '/placeholder.jpg'} 
                                        alt={blog.title} 
                                        fill 
                                        className="object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{blog.title}</h4>
                                <p className="text-xs text-gray-500 mb-2">{blog.date}</p>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(blog)} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200">
                                        Ред.
                                    </button>
                                    <button onClick={() => handleDelete(blog._id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">
                                        Удал.
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}