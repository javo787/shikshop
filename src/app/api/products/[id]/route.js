import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await connectMongoDB();
    const { id } = params;

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const fixImage = (img) => {
      if (!img) return null;
      let clean = img.toString().trim();
      if (clean.includes('/api/images/http')) clean = clean.replace('/api/images/', '');
      if (clean.startsWith('http') || clean.startsWith('/')) return clean;
      return `/api/images/${clean}`;
    };

    // Формируем ответ с новыми полями
    const enhancedProduct = {
      ...product.toObject(),
      _id: product._id.toString(),
      image: fixImage(product.image),
      imageLarge: fixImage(product.imageLarge),
      // 🔥 ВАЖНО: Возвращаем tryOnImage
      tryOnImage: fixImage(product.tryOnImage), 
      // aiCategory вернется автоматически, т.к. это просто строка
      additionalImages: product.additionalImages?.map(fixImage) || []
    };

    return NextResponse.json(enhancedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
