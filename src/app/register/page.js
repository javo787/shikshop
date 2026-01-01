'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider, // 1. Импорт провайдера Google
  signInWithPopup     // 1. Импорт функции всплывающего окна
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Иконки (Eye, EyeSlash, Google)
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '+992',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [globalError, setGlobalError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Логика ввода телефона
  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('+992')) val = '+992';
    const digitsOnly = val.replace(/[^\d+]/g, '');
    if (digitsOnly.length <= 13) {
      setFormData({ ...formData, phone: digitsOnly });
      if (errors.phone) setErrors({ ...errors, phone: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Введите ваше имя';
    if (!formData.email.includes('@')) newErrors.email = 'Некорректный Email';
    if (formData.phone.length !== 13) newErrors.phone = 'Номер должен содержать 9 цифр после кода +992';
    if (formData.password.length < 6) newErrors.password = 'Пароль должен быть не менее 6 символов';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Пароли не совпадают';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 2. Обработчик входа через Google
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setGlobalError(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Синхронизация с базой данных
      // Google не всегда отдает телефон, поэтому отправляем пустую строку или то, что есть
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || 'Google User',
          phone: user.phoneNumber || '' 
        }),
      });

      if (!res.ok) throw new Error('Ошибка синхронизации данных');

      router.push('/profile');
    } catch (error) {
      console.error(error);
      setGlobalError('Не удалось войти через Google. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик обычной регистрации
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.name });

      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: formData.name,
          phone: formData.phone
        }),
      });

      if (!res.ok) throw new Error('Ошибка сохранения профиля');

      router.push('/profile'); 
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setGlobalError('Этот Email уже зарегистрирован');
      } else {
        setGlobalError('Ошибка регистрации. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-dark-teal py-20 px-4">
      <div className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-serif font-bold text-center mb-2 text-dark-teal dark:text-white">Регистрация</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Создайте аккаунт в PARIZOD</p>
        
        {globalError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-100 dark:border-red-900/30">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Имя */}
          <div>
            <input 
              type="text" placeholder="Ваше имя" 
              className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-white/10 border focus:outline-none transition-colors text-dark-teal dark:text-white
                ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary-pink'}`}
              value={formData.name}
              onChange={e => {
                setFormData({...formData, name: e.target.value});
                if(errors.name) setErrors({...errors, name: null});
              }}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <input 
              type="email" placeholder="Email" 
              className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-white/10 border focus:outline-none transition-colors text-dark-teal dark:text-white
                ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary-pink'}`}
              value={formData.email}
              onChange={e => {
                setFormData({...formData, email: e.target.value});
                if(errors.email) setErrors({...errors, email: null});
              }}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
          </div>

          {/* Телефон (+992...) */}
          <div>
            <input 
              type="tel" 
              placeholder="+992XXXXXXXXX" 
              className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-white/10 border focus:outline-none transition-colors text-dark-teal dark:text-white
                ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary-pink'}`}
              value={formData.phone}
              onChange={handlePhoneChange}
              maxLength={13} 
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
          </div>

          {/* Пароль */}
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Пароль" 
              className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-white/10 border focus:outline-none transition-colors text-dark-teal dark:text-white pr-10
                ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary-pink'}`}
              value={formData.password}
              onChange={e => {
                setFormData({...formData, password: e.target.value});
                if(errors.password) setErrors({...errors, password: null});
              }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-dark-teal dark:hover:text-white transition-colors"
            >
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
            {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
          </div>

          {/* Повтор пароля */}
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Повторите пароль" 
              className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-white/10 border focus:outline-none transition-colors text-dark-teal dark:text-white pr-10
                ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary-pink'}`}
              value={formData.confirmPassword}
              onChange={e => {
                setFormData({...formData, confirmPassword: e.target.value});
                if(errors.confirmPassword) setErrors({...errors, confirmPassword: null});
              }}
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-dark-teal dark:hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</p>}
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="btn mt-2 w-full text-lg shadow-lg relative overflow-hidden group"
          >
            <span className="relative z-10">{loading ? 'Создаем аккаунт...' : 'Зарегистрироваться'}</span>
          </button>
        </form>

        {/* 3. Разделитель и Кнопка Google */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
          <span className="px-4 text-sm text-gray-400">или</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-200 font-medium"
        >
          <GoogleIcon />
          Продолжить с Google
        </button>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Уже есть аккаунт? <Link href="/login" className="text-accent-rose hover:underline font-medium">Войти</Link>
        </p>
      </div>
    </div>
  );
}