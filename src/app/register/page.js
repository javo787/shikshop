'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; //
import { useRouter } from 'next/navigation';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // 1. Создаем пользователя в Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Сохраняем дополнительные данные в MongoDB (через API)
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firebaseUid: user.uid, 
          email: user.email 
        }),
      });

      router.push('/profile');
    } catch (err) {
      setError('Ошибка регистрации: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-dark-teal">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-dark-teal">Регистрация</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <input 
          type="email" placeholder="Email" required 
          className="w-full p-3 mb-4 border rounded"
          onChange={e => setEmail(e.target.value)}
        />
        <input 
          type="password" placeholder="Пароль" required 
          className="w-full p-3 mb-6 border rounded"
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full bg-accent-rose text-white p-3 rounded hover:bg-primary-pink transition">
          Создать аккаунт
        </button>
      </form>
    </div>
  );
}