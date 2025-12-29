import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(req, { params }) {
  console.log("🚀 GET /api/products/[id]: Запуск метода GET");
  console.log("📥 Параметры из запроса: id=", params.id || "не указан");

  try {
    console.log("🔌 Подключение к MongoDB...");
    await connectMongoDB();
    console.log("🔌 Подключение к MongoDB успешно");

    const { id } = await params;
    console.log("🔍 Проверка ID: isValid=", mongoose.Types.ObjectId.isValid(id));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Ошибка: Invalid ID");
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    console.log("🛠 Поиск продукта по ID...");
    const product = await Product.findById(id);
    console.log("🛠 Продукт найден:", product ? "да" : "нет");

    if (!product) {
      console.log("❌ Ошибка: Not found");
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 👇 МОЩНАЯ ФУНКЦИЯ ОЧИСТКИ (логируем её вызов)
    console.log("🧹 Очистка изображений...");
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

    const p = product.toObject();
    const enhancedProduct = {
      ...p,
      _id: p._id.toString(),
      image: fixImage(p.image),
      imageLarge: fixImage(p.imageLarge),
      additionalImages: p.additionalImages?.map(fixImage) || []
    };
    console.log("✅ Продукт очищен и готов: _id=", enhancedProduct._id);

    return NextResponse.json(enhancedProduct);
  } catch (error) {
    console.error("❌ Ошибка в GET:", error.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  console.log("🚀 PUT /api/products/[id]: Запуск метода PUT");
  console.log("📥 Параметры из запроса: id=", params.id || "не указан");

  try {
    console.log("🔌 Подключение к MongoDB...");
    await connectMongoDB();
    console.log("🔌 Подключение к MongoDB успешно");

    const { id } = await params;
    console.log("📥 Чтение данных из запроса...");
    const data = await req.json();
    console.log("📥 Данные получены:", data ? "есть" : "нет");

    console.log("🛠 Обновление продукта по ID...");
    const updated = await Product.findByIdAndUpdate(id, data, { new: true });
    console.log("✅ Продукт обновлён:", updated ? "да" : "нет");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Ошибка в PUT:", error.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  console.log("🚀 DELETE /api/products/[id]: Запуск метода DELETE");
  console.log("📥 Параметры из запроса: id=", params.id || "не указан");

  try {
    console.log("🔌 Подключение к MongoDB...");
    await connectMongoDB();
    console.log("🔌 Подключение к MongoDB успешно");

    const { id } = await params;

    console.log("🛠 Удаление продукта по ID...");
    await Product.findByIdAndDelete(id);
    console.log("✅ Продукт удалён успешно");

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error("❌ Ошибка в DELETE:", error.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}