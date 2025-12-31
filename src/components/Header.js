'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setCookie } from 'cookies-next';
import Icon from './Icon';
import { useCart } from '@/context/CartContext'; // <--- Новый импорт для корзины

export default function Header({ locale }) {
  const t = useTranslations('header');
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Состояние для отслеживания скролла
  const [isScrolled, setIsScrolled] = useState(false);

  const { cartCount } = useCart(); // <--- Достаем количество товаров в корзине

  // Слушаем скролл
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!['ru', 'tg'].includes(selectedLocale)) {
      setSelectedLocale('ru');
      setCookie('my_shikshop_locale', 'ru');
      router.refresh();
    }
  }, [selectedLocale, router]);

  const changeLocale = (newLocale) => {
    setSelectedLocale(newLocale);
    setCookie('my_shikshop_locale', newLocale);
    router.refresh();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Логика определения страницы
  const isHome = pathname === `/${selectedLocale}` || pathname === '/';
  const showHomeIcon = !isHome;

  return (
    <>
      <header
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'glass py-3 text-dark-teal dark:text-text-light shadow-md' // При скролле: эффект стекла, компактный размер
            : isHome 
              ? 'bg-transparent py-5 text-white' // На главной вверху: прозрачный фон
              : 'bg-white dark:bg-dark-teal py-5 text-dark-teal dark:text-text-light shadow-sm' // На других страницах вверху: белый/темный фон
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          {/* Логотип */}
          <h1 className="text-3xl font-serif font-bold tracking-wider hover:scale-105 transition-transform">
            <Link href="/">{t('title')}</Link>
          </h1>

          {/* Десктопное меню */}
          <div className="hidden md:flex items-center space-x-8">
            <ul className="flex space-x-6 text-sm font-medium uppercase tracking-wide">
              <li>
                <Link href="/" className="hover:text-primary-pink transition-colors relative group">
                  {t('home')}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-pink transition-all group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary-pink transition-colors relative group">
                  {t('about')}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-pink transition-all group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-primary-pink transition-colors relative group">
                  {t('contacts')}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-pink transition-all group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
            
            <div className="flex items-center space-x-5 border-l border-current/30 pl-6">
              {showHomeIcon ? (
                <Link href="/" className="hover:text-primary-pink transition-transform hover:-translate-y-0.5">
                  <Icon name="home" className="w-6 h-6" />
                </Link>
              ) : (
                <Link href="/catalog" className="hover:text-primary-pink font-medium uppercase text-sm transition-transform hover:-translate-y-0.5">
                  {t('catalog')}
                </Link>
              )}
              
              {/* Скрываем Lookbook, если мы уже там */}
              {pathname !== `/${selectedLocale}/lookbook` && pathname !== '/lookbook' && (
                <Link href="/lookbook" className="hover:text-primary-pink transition-transform hover:-translate-y-0.5" title={t('lookbook')}>
                   <Icon name="lookbook" className="w-6 h-6" />
                </Link>
              )}
              
              {/* Скрываем Profile, если мы уже там */}
              {pathname !== `/${selectedLocale}/profile` && pathname !== '/profile' && (
                <Link href="/profile" className="hover:text-primary-pink transition-transform hover:-translate-y-0.5">
                  <Icon name="login" className="w-6 h-6" />
                </Link>
              )}
              
              <Link href="/cart" className="hover:text-primary-pink transition-transform hover:-translate-y-0.5 relative group">
                <Icon name="cart" className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-rose text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => changeLocale('ru')}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  selectedLocale === 'ru' 
                    ? 'bg-primary-pink text-dark-teal shadow-md' 
                    : 'hover:bg-black/10 dark:hover:bg-white/20'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => changeLocale('tg')}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  selectedLocale === 'tg' 
                    ? 'bg-primary-pink text-dark-teal shadow-md' 
                    : 'hover:bg-black/10 dark:hover:bg-white/20'
                }`}
              >
                TJ
              </button>
            </div>
          </div>

          {/* Мобильное меню (иконки + бургер) */}
          <div className="md:hidden flex items-center space-x-4">
             {showHomeIcon ? (
                <Link href="/" className="hover:text-primary-pink">
                  <Icon name="home" className="w-6 h-6" />
                </Link>
              ) : (
                <Link href="/catalog" className="hover:text-primary-pink">
                  <Icon name="catalog" className="w-6 h-6" />
                </Link>
              )}
             
             <Link href="/cart" className="hover:text-primary-pink relative group">
              <Icon name="cart" className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent-rose text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
            
            <button onClick={toggleMenu} className="focus:outline-none transition-transform active:scale-95">
              <Icon name={isMenuOpen ? 'close' : 'burger'} className="w-7 h-7" />
            </button>
          </div>
        </nav>
      </header>
      
      {/* ВАЖНО: Этот блок создает пространство под хедером на всех страницах, кроме главной.
          Благодаря этому контент не прячется под фиксированной шапкой.
      */}
      {!isHome && (
        <div className="h-[88px] w-full" aria-hidden="true"></div>
      )}

      {/* Выдвижное мобильное меню (Стиль шторки) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Затемнение фона */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={closeMenu}></div>
          
          {/* Сама панель меню */}
          <div className="absolute top-0 right-0 h-full w-[80%] max-w-sm bg-bg-light dark:bg-dark-teal shadow-2xl transform transition-transform duration-300 ease-out p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
               <span className="text-xl font-serif font-bold text-dark-teal dark:text-white">{t('title')}</span>
               <button onClick={closeMenu} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Icon name="close" className="w-6 h-6 text-dark-teal dark:text-text-light" />
              </button>
            </div>
            
            <div className="flex flex-col space-y-4 text-lg font-medium text-dark-teal dark:text-text-light">
              <Link href="/" onClick={closeMenu} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-secondary-peach/30 dark:hover:bg-white/5 transition-colors">
                <Icon name="home" className="w-5 h-5 text-accent-rose" />
                <span>{t('home')}</span>
              </Link>
              <Link href="/catalog" onClick={closeMenu} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-secondary-peach/30 dark:hover:bg-white/5 transition-colors">
                <Icon name="catalog" className="w-5 h-5 text-accent-rose" />
                <span>{t('catalog')}</span>
              </Link>
              <Link href="/lookbook" onClick={closeMenu} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-secondary-peach/30 dark:hover:bg-white/5 transition-colors">
                <Icon name="lookbook" className="w-5 h-5 text-accent-rose" />
                <span>{t('lookbook')}</span>
              </Link>
               <Link href="/about" onClick={closeMenu} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-secondary-peach/30 dark:hover:bg-white/5 transition-colors">
                <Icon name="about" className="w-5 h-5 text-accent-rose" />
                <span>{t('about')}</span>
              </Link>
              <Link href="/contacts" onClick={closeMenu} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-secondary-peach/30 dark:hover:bg-white/5 transition-colors">
                <Icon name="contacts" className="w-5 h-5 text-accent-rose" />
                <span>{t('contacts')}</span>
              </Link>
              <Link href="/profile" onClick={closeMenu} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-secondary-peach/30 dark:hover:bg-white/5 transition-colors">
                <Icon name="login" className="w-5 h-5 text-accent-rose" />
                <span>{t('login')}</span>
              </Link>
            </div>

            <div className="mt-auto pt-6">
               <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => changeLocale('ru')} 
                    className={`flex-1 py-3 rounded-xl text-center font-bold shadow-sm transition-all ${selectedLocale === 'ru' ? 'bg-primary-pink text-dark-teal' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
                  >
                    Русский
                  </button>
                  <button 
                    onClick={() => changeLocale('tg')} 
                    className={`flex-1 py-3 rounded-xl text-center font-bold shadow-sm transition-all ${selectedLocale === 'tg' ? 'bg-primary-pink text-dark-teal' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
                  >
                    Тоҷикӣ
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}