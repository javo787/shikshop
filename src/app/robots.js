export default function robots() {
  // Замените на ваш реальный домен, когда купите parizod.tj
  const baseUrl = 'https://shikshop.vercel.app'; 

  return {
    rules: {
      userAgent: '*', // Правила для всех роботов (Google, Yandex, Bing)
      allow: '/',     // Разрешаем читать весь сайт
      disallow: [     // ЗАПРЕЩАЕМ читать личные данные
        '/api/',      // Нечего им делать в API
        '/admin/',    // Админку скрываем
        '/profile/',  // Личные кабинеты пользователей
        '/cart/',     // Корзину
        '/checkout/', // Оформление заказа
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`, // Указываем, где лежит карта
  }
}