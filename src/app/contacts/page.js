import ContactsClient from './ContactsClient';

export const metadata = {
  title: 'Контакты | PARIZOD - Свяжитесь с нами',
  description: 'Контактная информация PARIZOD: email, телефон, адрес. Форма обратной связи для вопросов о женской одежде и заказах.',
  keywords: 'контакты, PARIZOD, обратная связь, купить одежду, поддержка, адрес магазина',
  openGraph: {
    title: 'Контакты | PARIZOD',
    description: 'Свяжитесь с нами для вопросов о заказах и продукции.',
    images: ['/og-image.jpg'], // Замени на реальный путь к изображению для OG (если есть)
    url: 'https://shikshop.vercel.app/contacts', // Замени на URL твоего сайта
  },
  robots: 'index, follow',
};

export default function ContactsPage() {
  return <ContactsClient />;
}