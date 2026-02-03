'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Icon from './Icon';

export default function Footer() {
  // Используем пространство имен 'home', так как в вашем словаре переводы футера лежат там
  const t = useTranslations('home');

  // Состояния для формы подписки
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // 'loading', 'success', 'error', ''

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
        const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
            setStatus('success');
            setEmail('');
            alert(data.message || 'Вы успешно подписались!'); 
        } else {
            setStatus('error');
            alert(data.error || 'Ошибка подписки');
        }
    } catch (error) {
        setStatus('error');
        console.error('Ошибка при подписке:', error);
        alert('Произошла ошибка при отправке данных');
    } finally {
        setStatus('');
    }
  };

  return (
    <footer className="bg-dark-teal text-white pt-16 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Основная сетка: 3 колонки на ПК, 1 на мобильном */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Колонка 1: Подписка */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-serif font-bold mb-6 tracking-wide text-primary-pink">
              {t('footerSubscribeTitle')}
            </h3>
            <p className="mb-4 text-gray-300 text-sm font-light">
              Узнавайте о новинках и закрытых распродажах первыми.
            </p>
            <form className="flex flex-col gap-3" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder={t('footerSubscribePlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-primary-pink transition-colors disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={status === 'loading'}
                className="btn w-full md:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Обработка...' : t('footerSubscribeButton')}
              </button>
            </form>
          </div>

          {/* Колонка 2: Контакты */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-serif font-bold mb-6 tracking-wide text-primary-pink">
              {t('footerContactTitle')}
            </h3>
            <div className="space-y-4 text-gray-300 font-light">
              <p className="flex items-center justify-center md:justify-start gap-3">
                <span className="opacity-70">📍</span> {t('footerAddress')}
              </p>
              <p className="flex items-center justify-center md:justify-start gap-3">
                <span className="opacity-70">📞</span> {t('footerPhone')}
              </p>
              <p className="flex items-center justify-center md:justify-start gap-3">
                <span className="opacity-70">✉️</span> {t('footerEmail')}
              </p>
            </div>
            
            {/* Соцсети */}
            <div className="flex justify-center md:justify-start space-x-6 mt-8">
              <a 
                href="https://www.instagram.com/parizod_tj/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-primary-pink hover:scale-110 transition-all duration-300 bg-white/5 p-3 rounded-full"
              >
                <Icon name="instagram" className="w-6 h-6" />
              </a>
              <a 
                href="https://whatsapp.com/channel/0029VbAeSyaAzNbnGuVFzZ1r" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-primary-pink hover:scale-110 transition-all duration-300 bg-white/5 p-3 rounded-full"
              >
                <Icon name="whatsapp" className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Колонка 3: Навигация */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-serif font-bold mb-6 tracking-wide text-primary-pink">
              {t('footerLinksTitle')}
            </h3>
            <ul className="space-y-3 text-gray-300 font-light">
              <li>
                <Link href="/" className="hover:text-primary-pink hover:pl-2 transition-all duration-300 block">
                  {t('headerhome')}
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-primary-pink hover:pl-2 transition-all duration-300 block">
                  {t('headercatalog')}
                </Link>
              </li>
              <li>
                <Link href="/lookbook" className="hover:text-primary-pink hover:pl-2 transition-all duration-300 block">
                  {t('headerlookbook')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary-pink hover:pl-2 transition-all duration-300 block">
                  {t('headerabout')}
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-primary-pink hover:pl-2 transition-all duration-300 block">
                  {t('headercontacts')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Копирайт */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-gray-500 text-sm font-serif italic">
            {t('footerCopyright')}
          </p>
          <div className="mt-2 text-xs text-gray-600">
            Designed with ❤️ for Parizod
          </div>
        </div>
      </div>
    </footer>
  );
}