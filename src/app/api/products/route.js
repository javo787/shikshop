import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  console.log("🚀 GET /api/products: Запуск метода GET");

  try {
    console.log("🔌 Подключение к MongoDB...");
    await connectMongoDB();
    console.log("🔌 Подключение к MongoDB успешно");

    console.log("📥 Чтение параметров из URL...");
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    console.log("📥 Фильтры: category=", category || "не указан", ", type=", type || "не указан");

    const filter = {};
    if (category && category !== 'undefined') filter.category = category;
    if (type && type !== 'undefined') filter.type = type;
    console.log("🔍 Фильтр для поиска:", filter);

    console.log("🛠 Поиск продуктов...");
    const products = await Product.find(filter).sort({ createdAt: -1 });
    console.log("🛠 Найдено продуктов:", products.length);

    // 👇 МОЩНАЯ ФУНКЦИЯ ОЧИСТКИ (логируем её вызов)
    console.log("🧹 Очистка изображений для всех продуктов...");
    const fixImage = (img) => {
      if (!img) return null;
      let clean = img.toString().trim();

      if (clean.includes('/api/images/http')) {
        clean = clean.replace('/api/images/', '');
        console.log("🧹 Очистка: Убрали /api/images/ из", img);
      }

      if (clean.startsWith('http') || clean.startsWith('/')) {
        console.log("🧹 Очистка: Уже чистый путь", clean);
        return clean;
      }
      console.log("🧹 Очистка: Добавили префикс к", clean);
      return `/api/images/${clean}`;
    };

    const enhancedProducts = products.map(product => {
      const p = product.toObject();
      return {
        ...p,
        _id: p._id.toString(),
        image: fixImage(p.image),
        imageLarge: fixImage(p.imageLarge),
        additionalImages: p.additionalImages?.map(fixImage) || []
      };
    });
    console.log("✅ Все продукты очищены и готовы: количество=", enhancedProducts.length);

    return NextResponse.json(enhancedProducts);
  } catch (error) {
    console.error("❌ Ошибка в GET:", error.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req) {
  console.log("🚀 POST /api/products: Запуск метода POST");

  try {
    console.log("🔌 Подключение к MongoDB...");
    await connectMongoDB();
    console.log("🔌 Подключение к MongoDB успешно");

    console.log("📥 Чтение данных из запроса...");
    const productData = await req.json();
    console.log("📥 Данные получены:", productData ? "есть" : "нет");

    console.log("🛠 Создание нового продукта...");
    const newProduct = await Product.create(productData);
    console.log("✅ Новый продукт создан: _id=", newProduct._id);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("❌ Ошибка в POST:", error.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}