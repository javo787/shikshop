'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setCookie } from 'cookies-next';
import Icon from './Icon';

export default function Header({ locale }) {
  const t = useTranslations('header');
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Определяем, какую иконку показывать вместо текущей страницы
  const isHome = pathname === `/${selectedLocale}` || pathname === '/';
  const showHomeIcon = !isHome;

  return (
    <>
      <header className="bg-dark-teal/90 backdrop-blur-sm text-bg-light py-4 sticky top-0 shadow-sm transition-all duration-300 z-10">
        <nav className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          {/* Логотип */}
          <h1 className="text-2xl font-bold">
            <Link href="/">{t('title')}</Link>
          </h1>

          {/* Десктопное меню */}
          <div className="hidden md:flex items-center space-x-6">
            <ul className="flex space-x-4">
              <li><Link href="/" className="hover:text-primary-pink transition-colors">{t('home')}</Link></li>
              <li><Link href="/about" className="hover:text-primary-pink transition-colors">{t('about')}</Link></li>
              <li><Link href="/contacts" className="hover:text-primary-pink transition-colors">{t('contacts')}</Link></li>
            </ul>
            <div className="flex space-x-4">
              {showHomeIcon ? (
                <Link href="/" className="hover:text-primary-pink">
                  <Icon name="home" className="w-6 h-6" />
                </Link>
              ) : (
                <Link href="/catalog" className="hover:text-primary-pink">
                  {t('catalog')}
                </Link>
              )}
              {pathname !== `/${selectedLocale}/lookbook` && pathname !== '/lookbook' && (
                <Link href="/lookbook" className="hover:text-primary-pink">
                  {t('lookbook')}
                </Link>
              )}
              {pathname !== `/${selectedLocale}/login` && pathname !== '/login' && (
                <Link href="/login" className="hover:text-primary-pink">
                  <Icon name="login" className="w-6 h-6" />
                </Link>
              )}
              <Link href="/cart" className="hover:text-primary-pink">
                <Icon name="cart" className="w-6 h-6" />
              </Link>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => changeLocale('ru')}
                className={`px-3 py-1 rounded ${selectedLocale === 'ru' ? 'bg-primary-pink text-dark-teal' : 'bg-neutral-gray text-bg-light'} hover:bg-secondary-peach`}
              >
                Русский
              </button>
              <button
                onClick={() => changeLocale('tg')}
                className={`px-3 py-1 rounded ${selectedLocale === 'tg' ? 'bg-primary-pink text-dark-teal' : 'bg-neutral-gray text-bg-light'} hover:bg-secondary-peach`}
              >
                Тоҷикӣ
              </button>
            </div>
          </div>

          {/* Мобильное меню */}
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
            {pathname !== `/${selectedLocale}/lookbook` && pathname !== '/lookbook' && (
              <Link href="/lookbook" className="hover:text-primary-pink">
                <Icon name="lookbook" className="w-6 h-6" />
              </Link>
            )}
            {pathname !== `/${selectedLocale}/login` && pathname !== '/login' && (
              <Link href="/login" className="hover:text-primary-pink">
                <Icon name="login" className="w-6 h-6" />
              </Link>
            )}
            <Link href="/cart" className="hover:text-primary-pink">
              <Icon name="cart" className="w-6 h-6" />
            </Link>
            <button onClick={toggleMenu} className="text-bg-light">
              <Icon name={isMenuOpen ? 'close' : 'burger'} className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Выдвижное мобильное меню */}
      {isMenuOpen && (
        <div
          className="fixed top-0 right-0 h-full bg-dark-teal/90 backdrop-blur-sm text-bg-light w-64 transform translate-x-0 transition-transform duration-300 ease-in-out z-100 md:hidden"
        >
          <button
            onClick={closeMenu}
            className="absolute top-4 right-4 text-bg-light hover:text-primary-pink"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
          <div className="flex flex-col p-4 space-y-4 mt-16">
            <Link href="/" onClick={closeMenu} className="flex items-center space-x-2 hover:text-primary-pink text-lg">
              <Icon name="home" className="w-5 h-5" />
              <span>{t('home')}</span>
            </Link>
            <Link href="/catalog" onClick={closeMenu} className="flex items-center space-x-2 hover:text-primary-pink text-lg">
              <Icon name="catalog" className="w-5 h-5" />
              <span>{t('catalog')}</span>
            </Link>
            <Link href="/lookbook" onClick={closeMenu} className="flex items-center space-x-2 hover:text-primary-pink text-lg">
              <Icon name="lookbook" className="w-5 h-5" />
              <span>{t('lookbook')}</span>
            </Link>
            <Link href="/about" onClick={closeMenu} className="flex items-center space-x-2 hover:text-primary-pink text-lg">
              <Icon name="about" className="w-5 h-5" />
              <span>{t('about')}</span>
            </Link>
            <Link href="/contacts" onClick={closeMenu} className="flex items-center space-x-2 hover:text-primary-pink text-lg">
              <Icon name="contacts" className="w-5 h-5" />
              <span>{t('contacts')}</span>
            </Link>
            <Link href="/login" onClick={closeMenu} className="flex items-center space-x-2 hover:text-primary-pink text-lg">
              <Icon name="login" className="w-5 h-5" />
              <span>{t('login')}</span>
            </Link>
            <div className="flex flex-col space-y-2 pt-4">
              <button
                onClick={() => changeLocale('ru')}
                className={`px-3 py-1 rounded text-left ${selectedLocale === 'ru' ? 'bg-primary-pink text-dark-teal' : 'bg-neutral-gray text-bg-light'} hover:bg-secondary-peach`}
              >
                Русский
              </button>
              <button
                onClick={() => changeLocale('tg')}
                className={`px-3 py-1 rounded text-left ${selectedLocale === 'tg' ? 'bg-primary-pink text-dark-teal' : 'bg-neutral-gray text-bg-light'} hover:bg-secondary-peach`}
              >
                Тоҷикӣ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}