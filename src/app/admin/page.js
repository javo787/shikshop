'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase.js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Admin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (err) {
      setError('Ошибка входа: проверьте email или пароль');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/admin');
  };

  if (user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-text-dark mb-6">Админ-панель</h1>
        <div className="flex flex-col gap-4">
          <Link href="/admin/javo" className="bg-accent-rose text-text-light px-4 py-2 rounded text-center hover:bg-opacity-90">
            Управление товарами
          </Link>
          <Link href="/admin/messages" className="bg-accent-rose text-text-light px-4 py-2 rounded text-center hover:bg-opacity-90">
            Сообщения
          </Link>
          <Link href="/admin/reviews" className="bg-accent-rose text-text-light px-4 py-2 rounded text-center hover:bg-opacity-90">
            Управление отзывами
          </Link>
          <Link href="/admin/blogs" className="bg-accent-rose text-text-light px-4 py-2 rounded text-center hover:bg-opacity-90">
            Управление блогами
          </Link>
          <button onClick={handleSignOut} className="bg-neutral-gray text-text-dark px-4 py-2 rounded hover:bg-opacity-90">
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-text-dark mb-6">Вход в админ-панель</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 max-w-md">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <button type="submit" className="bg-accent-rose text-text-light px-4 py-2 rounded">
          Войти
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}