'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ProductCard from '../../components/ProductCard';
import Icon from '../../components/Icon';

export default function CatalogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const productsPerPage = 12;

  // Загрузка фильтров из URL
  useEffect(() => {
    setCategoryFilter(searchParams.get('category') || '');
    setTypeFilter(searchParams.get('type') || '');
    setSearchQuery(searchParams.get('search') || '');
    setSortOption(searchParams.get('sort') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setCurrentPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  // Обновление URL при изменении фильтров
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryFilter) params.set('category', categoryFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (sortOption) params.set('sort', sortOption);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    params.set('page', currentPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  }, [categoryFilter, typeFilter, searchQuery, sortOption, minPrice, maxPrice, currentPage, router]);

  // Показ/скрытие кнопки "Наверх"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Не удалось загрузить товары');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError('Ошибка загрузки каталога');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Кэширование фильтрации и сортировки
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
        const matchesType = typeFilter ? product.type === typeFilter : product.type !== 'look';
        const matchesSearch = searchQuery
          ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
          : true;
        const matchesPrice =
          (minPrice ? (product.price || 0) >= Number(minPrice) : true) &&
          (maxPrice ? (product.price || 0) <= Number(maxPrice) : true);
        return matchesCategory && matchesType && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortOption === 'price-asc') return (a.price || 0) - (b.price || 0);
        if (sortOption === 'price-desc') return (b.price || 0) - (a.price || 0);
        if (sortOption === 'name') return a.name.localeCompare(b.name);
        if (sortOption === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        return 0;
      });
  }, [products, categoryFilter, typeFilter, searchQuery, sortOption, minPrice, maxPrice]);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const types = ['product', 'collection'];

  // Пагинация
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setCategoryFilter('');
    setTypeFilter('');
    setSearchQuery('');
    setSortOption('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  const openQuickView = (product) => {
    setSelectedProduct(product);
  };

  const closeQuickView = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="container mx-auto p-4 relative">
      <h1 className="text-3xl font-bold text-text-dark mb-6">Каталог</h1>

      {/* Компактные фильтры */}
      <div className="mb-6 space-y-2">
        {/* Поиск с иконкой */}
        <div className="relative">
          <label htmlFor="search" className="sr-only">
            Поиск товаров
          </label>
          <div className="absolute inset-y-0 left-0 flex items-center pl-2">
            <Icon name="search" className="w-4 h-4 text-gray-500" />
          </div>
          <input
            id="search"
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Поиск товаров"
          />
        </div>

        {/* Категория, тип, сортировка в одной строке */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="relative">
            <label htmlFor="category" className="sr-only">
              Фильтр по категории
            </label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
              <Icon name="catalog" className="w-4 h-4 text-gray-500" />
            </div>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-8 p-2 text-xs sm:text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Фильтр по категории"
            >
              <option value="">Категория</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label htmlFor="type" className="sr-only">
              Фильтр по типу
            </label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
              <Icon name="lookbook" className="w-4 h-4 text-gray-500" />
            </div>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-8 p-2 text-xs sm:text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Фильтр по типу"
            >
              <option value="">Тип</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type === 'product' ? 'Товары' : 'Коллекции'}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label htmlFor="sort" className="sr-only">
              Сортировка товаров
            </label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
              <Icon name="sort" className="w-4 h-4 text-gray-500" />
            </div>
            <select
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full pl-8 p-2 text-xs sm:text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Сортировка товаров"
            >
              <option value="">Сортировка</option>
              <option value="price-asc">Цена ↑</option>
              <option value="price-desc">Цена ↓</option>
              <option value="name">Название</option>
              <option value="newest">Новинки</option>
            </select>
          </div>
        </div>

        {/* Поля ввода цены */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="relative">
            <label htmlFor="minPrice" className="sr-only">
              Минимальная цена
            </label>
            <input
              id="minPrice"
              type="number"
              placeholder="Мин. цена"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full p-2 text-xs sm:text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Минимальная цена"
              min="0"
            />
          </div>
          <div className="relative">
            <label htmlFor="maxPrice" className="sr-only">
              Максимальная цена
            </label>
            <input
              id="maxPrice"
              type="number"
              placeholder="Макс. цена"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full p-2 text-xs sm:text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Максимальная цена"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Кнопка сброса фильтров */}
      {(categoryFilter || typeFilter || searchQuery || sortOption || minPrice || maxPrice) && (
        <button
          onClick={resetFilters}
          className="mb-4 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Сбросить все фильтры"
        >
          Сбросить
        </button>
      )}

      {/* Ошибка и кнопка "Повторить" */}
      {error && (
        <div className="mb-4 text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Повторить загрузку каталога"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Спиннер загрузки */}
      {loading && (
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Сетка товаров с анимацией */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((product, index) => (
              <div
                key={product._id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard product={product} onQuickView={() => openQuickView(product)} />
              </div>
            ))
          ) : (
            <p className="text-text-gray col-span-2 sm:col-span-2 md:col-span-3">
              Товары не найдены
            </p>
          )}
        </div>
      )}

      {/* Пагинация */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded text-sm ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-text-dark hover:bg-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label={`Перейти на страницу ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Кнопка "Наверх" */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 p-3 bg-blue-500 bg-opacity-70 rounded-full hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Прокрутить наверх"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Модальное окно для быстрого просмотра */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-text-dark">{selectedProduct.name || 'Без названия'}</h2>
              <button
                onClick={closeQuickView}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Закрыть модальное окно"
              >
                <Icon name="close" className="w-6 h-6" />
              </button>
            </div>
            {selectedProduct.image && (
              <div className="relative w-full h-64 mb-4">
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name || 'Товар'}
                  fill
                  className="object-contain rounded"
                />
              </div>
            )}
            <p className="text-lg font-semibold text-text-dark mb-2">
              {selectedProduct.price ? `${selectedProduct.price} ₽` : 'Цена не указана'}
            </p>
            <p className="text-text-gray mb-4">
              {selectedProduct.description || 'Описание отсутствует'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeQuickView}
                className="px-4 py-2 bg-gray-300 text-text-dark rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Закрыть"
              >
                Закрыть
              </button>
              <a
                href={`/product/${selectedProduct._id}`}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Перейти к товару ${selectedProduct.name || 'Товар'}`}
              >
                Подробнее
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}