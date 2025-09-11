import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const locales = ['ru', 'tg'];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = cookieStore.get('my_shikshop_locale')?.value;

  if (!locale || !locales.includes(locale)) {
    locale = 'ru';
  }
  console.log('i18n/request.js: using locale =', locale);

  try {
    const messages = (await import(`../messages/${locale}.json`)).default;
    console.log('i18n/request.js: loaded messages for locale =', locale);
    return {
      locale,
      messages,
    };
  } catch (error) {
    console.error('i18n/request.js: error loading messages for locale', locale, error);
    const messages = (await import(`../messages/ru.json`)).default;
    return {
      locale: 'ru',
      messages,
    };
  }
});