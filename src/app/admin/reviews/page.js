'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/admin');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews/all');
        if (!res.ok) throw new Error('Не удалось загрузить отзывы');
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        setError('Ошибка загрузки отзывов');
      }
    };

    if (user) {
      fetchReviews();
    }
  }, [user]);

  const handleDeleteReview = async (reviewId) => {
    try {
      const res = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Не удалось удалить отзыв');
      }
      setReviews(reviews.filter((review) => review._id !== reviewId));
      setSuccess('Отзыв успешно удалён');
      setError(null);
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    }
  };

  if (!user) {
    return <div className="text-center">Проверяется авторизация...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-text-dark mb-6">Управление отзывами</h1>
      <Link href="/admin" className="text-accent-rose hover:underline mb-4 inline-block">
        ← Назад в админ-панель
      </Link>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {reviews.map((review) => (
            <div key={review._id} className="p-4 border rounded">
              <p><strong>{review.userName}</strong> ({review.rating} звёзд)</p>
              <p className="text-text-gray">{review.comment}</p>
              <p className="text-sm text-text-gray">
                Товар ID: {review.productId}
              </p>
              <p className="text-sm text-text-gray">
                {new Date(review.createdAt).toLocaleString()}
              </p>
              <button
                onClick={() => handleDeleteReview(review._id)}
                className="bg-red-500 text-white px-3 py-1 rounded mt-2 hover:bg-red-600"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-gray">Отзывов пока нет</p>
      )}
    </div>
  );
}