import LookbookClient from './LookbookClient';

export const metadata = {
  title: 'Лукбук | PARIZOD - Галерея образов и стилей',
  description: 'Просмотрите галерею модных образов и стилей от PARIZOD. Вдохновение для вашего гардероба с женской одеждой и аксессуарами.',
  keywords: 'лукбук, образы, стили одежды, PARIZOD, модные луки, женская мода',
  openGraph: {
    title: 'Лукбук | PARIZOD',
    description: 'Галерея вдохновляющих образов для стильных женщин.',
    images: ['/og-image.jpg'], // Замени на реальный путь к изображению для OG (если есть)
    url: 'https://shikshop.vercel.app/lookbook', // Замени на URL твоего сайта
  },
  robots: 'index, follow',
};

export default function LookbookPage() {
  return <LookbookClient />;
}