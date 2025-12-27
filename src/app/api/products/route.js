import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    const filter = {};
    if (category && category !== 'undefined') filter.category = category;
    if (type && type !== 'undefined') filter.type = type;

    const products = await Product.find(filter).sort({ createdAt: -1 });

    // 👇 МОЩНАЯ ФУНКЦИЯ ОЧИСТКИ
    const fixImage = (img) => {
      if (!img) return null;
      let clean = img.toString().trim();

      // Если в базе мусор типа "/api/images/http...", чистим его
      if (clean.includes('/api/images/http')) {
        clean = clean.replace('/api/images/', '');
      }

      // Если теперь это http или локальный путь — возвращаем
      if (clean.startsWith('http') || clean.startsWith('/')) return clean;
      
      // Иначе это ID, добавляем префикс
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

    return NextResponse.json(enhancedProducts);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoDB();
    const productData = await req.json();
    const newProduct = await Product.create(productData);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}