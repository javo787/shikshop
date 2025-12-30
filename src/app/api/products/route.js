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

    // 👇 Функция очистки изображений
    const fixImage = (img) => {
      if (!img) return null;
      let clean = img.toString().trim();

      if (clean.includes('/api/images/http')) {
        clean = clean.replace('/api/images/', '');
      }

      if (clean.startsWith('http') || clean.startsWith('/')) {
        return clean;
      }
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
    console.error("❌ Ошибка в GET:", error.message);
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
    console.error("❌ Ошибка в POST:", error.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}