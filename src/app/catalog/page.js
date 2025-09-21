import CatalogClient from './CatalogClient';

export const metadata = {
  title: 'Каталог товаров | PARIZOD - Женская одежда и аксессуары',
  description: 'Просмотрите наш каталог стильной женской одежды, коллекций и аксессуаров. Фильтры по категории, типу, цене и поиск для удобного шопинга.',
  keywords: 'женская одежда, каталог товаров, коллекции, аксессуары, PARIZOD, купить одежду онлайн',
  openGraph: {
    title: 'Каталог товаров | PARIZOD',
    description: 'Широкий ассортимент женской одежды и аксессуаров с удобными фильтрами.',
    images: ['/og-image.jpg'], 
    url: 'https://shikshop.vercel.app/catalog',
  },
  robots: 'index, follow',
};

export default function CatalogPage() {
  return <CatalogClient />;
}