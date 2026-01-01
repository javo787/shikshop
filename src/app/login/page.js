'use client';

import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setCookie } from 'cookies-next';

// Компонент иконки Google
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Функция для сохранения куки (используется и в email, и в google входе)
  const saveAuthCookies = async (user) => {
    const token = await user.getIdToken();
    setCookie('parizod_token', token, { maxAge: 60 * 60 * 24 * 30 });
    setCookie('parizod_uid', user.uid, { maxAge: 60 * 60 * 24 * 30 });
    if (user.displayName) {
      setCookie('parizod_name', user.displayName, { maxAge: 60 * 60 * 24 * 30 });
    }
  };

  // 1. Вход по Email/Пароль
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await saveAuthCookies(user);

      router.push('/profile');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Неверный Email или пароль');
    } finally {
      setLoading(false);
    }
  };

  // 2. Вход через Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Сначала синхронизируем с базой (создаем юзера если нет)
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || 'Google User',
          phone: user.phoneNumber || ''
        }),
      });

      // Сохраняем куки
      await saveAuthCookies(user);

      router.push('/profile');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Не удалось войти через Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-dark-teal py-20 px-4">
       <div className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-serif font-bold text-center mb-2 text-dark-teal dark:text-white">Вход</h1>
         
         {error && (
           <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg mb-4 text-sm text-center border border-red-100 dark:border-red-900/30">
             {error}
           </div>
         )}

         <form onSubmit={handleLogin} className="flex flex-col gap-4">
             <input 
               type="email" 
               placeholder="Email" 
               required 
               className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink text-dark-teal dark:text-white transition-colors" 
               onChange={e => setEmail(e.target.value)} 
             />
             <input 
               type="password" 
               placeholder="Пароль" 
               required 
               className="p-3 rounded-xl bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-primary-pink text-dark-teal dark:text-white transition-colors" 
               onChange={e => setPassword(e.target.value)} 
             />
             
             <button 
               type="submit" 
               disabled={loading} 
               className="btn mt-2 w-full text-lg shadow-lg"
             >
               {loading ? 'Входим...' : 'Войти'}
             </button>
         </form>

         {/* Разделитель и кнопка Google */}
         <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
            <span className="px-4 text-sm text-gray-400">или</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
         </div>

         <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-200 font-medium"
         >
            <GoogleIcon />
            Войти через Google
         </button>

         <p className="text-center mt-6 text-gray-500 text-sm">
           Нет аккаунта? <Link href="/register" className="text-accent-rose hover:underline font-medium">Зарегистрироваться</Link>
         </p>
       </div>
    </div>
  );
}