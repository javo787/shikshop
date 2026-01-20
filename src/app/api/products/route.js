import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Product from '@/models/Product';

// Отключаем кэширование, чтобы всегда получать свежие данные
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectMongoDB();

    // 1. Получаем параметры фильтрации
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    const filter = {};
    if (category && category !== 'undefined') filter.category = category;
    if (type && type !== 'undefined') filter.type = type;

    // 2. Ищем товары в базе (сначала новые)
    const products = await Product.find(filter).sort({ createdAt: -1 });

    // 3. Утилита для очистки путей к картинкам
    const fixImage = (img) => {
      if (!img) return null;
      let clean = img.toString().trim();

      // Убираем дублирование путей, если оно возникло
      if (clean.includes('/api/images/http')) {
        clean = clean.replace('/api/images/', '');
      }

      // Если это внешняя ссылка или уже правильный путь -> возвращаем
      if (clean.startsWith('http') || clean.startsWith('/')) {
        return clean;
      }
      
      // Иначе добавляем префикс API
      return `/api/images/${clean}`;
    };

    // 4. Формируем красивый ответ для фронтенда
    const enhancedProducts = products.map(product => {
      const p = product.toObject();
      return {
        ...p,
        _id: p._id.toString(), // Превращаем ObjectId в строку
        
        // Обработка одиночных изображений
        image: fixImage(p.image),
        imageLarge: fixImage(p.imageLarge),
<<<<<<< HEAD
        tryOnImage: fixImage(p.tryOnImage), // Поддержка старого поля
        
        // Обработка массивов (с проверкой на существование)
        tryOnImages: Array.isArray(p.tryOnImages) ? p.tryOnImages.map(fixImage) : [],
        additionalImages: Array.isArray(p.additionalImages) ? p.additionalImages.map(fixImage) : []
=======
        // ✨ ВАЖНО: Добавили поле для примерки
        tryOnImage: fixImage(p.tryOnImage),
        additionalImages: p.additionalImages?.map(fixImage) || []
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
      };
    });

    return NextResponse.json(enhancedProducts);
  } catch (error) {
    console.error("❌ Ошибка в GET /api/products:", error.message);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoDB();

    const productData = await req.json();

    // Создаем товар.
<<<<<<< HEAD
    // Mongoose сам отфильтрует поля, которых нет в схеме,
    // но так как мы обновили src/models/Product.js, поле tryOnImages сохранится.
=======
    // Убедитесь, что модель Product (src/models/Product.js) содержит поля tryOnImage и aiCategory
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
    const newProduct = await Product.create(productData);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("❌ Ошибка в POST /api/products:", error.message);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
