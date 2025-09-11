'use client';

import { auth } from '@/src/lib/firebase';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { useTranslations } from 'next-intl';


export default function AdminBlogs() {
  const t = useTranslations('admin');
  const [blogs, setBlogs] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBlogs();
    }
  }, [user]);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result.split(',')[1]); // Extract base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const blogData = { title, content, image, date };

    try {
      if (editingId) {
        const res = await fetch('/api/blogs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...blogData }),
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch('/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blogData),
        });
        if (!res.ok) throw new Error('Failed to create');
      }
      setTitle('');
      setContent('');
      setImage(null);
      setDate('');
      setEditingId(null);
      fetchBlogs();
    } catch (error) {
      console.error('Error submitting blog:', error);
    }
  };

  const handleEdit = (blog) => {
    setTitle(blog.title);
    setContent(blog.content);
    setImage(blog.image);
    setDate(blog.date);
    setEditingId(blog._id);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch('/api/blogs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center">
        <p>{t('pleaseLogin')}</p>
        <Link href="/admin" className="text-accent-rose hover:underline">
          {t('login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-dark-teal dark:text-text-light mb-6">{t('blogsTitle')}</h1>
      <form onSubmit={handleSubmit} className="mb-8 max-w-2xl mx-auto">
        <Link href="/admin" className="text-accent-rose hover:underline mb-4 inline-block">
                ← Назад в админ-панель
              </Link>
        <div className="mb-4">
          <label className="block text-dark-teal dark:text-text-light">{t('title')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-dark-teal dark:text-text-light">{t('content')}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded"
            rows="5"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-dark-teal dark:text-text-light">{t('image')}</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-dark-teal dark:text-text-light">{t('date')}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="bg-accent-rose text-text-light px-4 py-2 rounded hover:bg-primary-pink">
          {editingId ? t('updateBlog') : t('createBlog')}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {blogs.map((blog) => (
          <div key={blog._id} className="p-4 bg-secondary-peach dark:bg-accent-emerald rounded">
            <h3 className="text-xl font-bold">{blog.title}</h3>
            <p className="text-sm text-neutral-gray">{blog.date}</p>
            <p>{blog.content.substring(0, 100)}...</p>
            {blog.image && (
              <img
                src={`data:image/jpeg;base64,${blog.image}`}
                alt={blog.title}
                width={100}
                height={50}
                className="w-24 h-12 object-cover rounded mt-2"
              />
            )}
            <div className="mt-2">
              <button
                onClick={() => handleEdit(blog)}
                className="mr-2 bg-primary-pink text-text-light px-3 py-1 rounded hover:bg-accent-rose"
              >
                {t('edit')}
              </button>
              <button
                onClick={() => handleDelete(blog._id)}
                className="bg-red-500 text-text-light px-3 py-1 rounded hover:bg-red-600"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}