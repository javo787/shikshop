'use client';

import { useState, useEffect } from 'react';
import LookbookCard from '../../components/LookbookCard';

export default function Lookbook() {
  const [looks, setLooks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLooks = async () => {
      try {
        const res = await fetch('/api/lookbook');
        if (!res.ok) throw new Error('Failed to fetch lookbook');
        const data = await res.json();
        setLooks(data);
      } catch (err) {
        setError('Ошибка загрузки лукбука');
      }
    };
    fetchLooks();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-text-dark mb-6">Лукбук</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {looks.map(look => (
          <LookbookCard key={look._id} look={look} />
        ))}
      </div>
    </div>
  );
}