'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/admin');
      } else {
        setUser(currentUser);
        fetchMessages();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError('Ошибка загрузки сообщений');
    }
  };

  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-text-dark mb-6">Сообщения</h1>
      <Link href="/admin" className="text-accent-rose hover:underline mb-4 inline-block">
        ← Назад в админ-панель
      </Link>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 gap-4">
        {messages.map((msg) => (
          <div key={msg._id} className="p-4 border rounded">
            <p><strong>Имя:</strong> {msg.name}</p>
            <p><strong>Email:</strong> {msg.email}</p>
            <p><strong>Сообщение:</strong> {msg.message}</p>
            <p><strong>Дата:</strong> {new Date(msg.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}