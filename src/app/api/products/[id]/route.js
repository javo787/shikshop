import { NextResponse } from 'next/server';
<<<<<<< HEAD
import mongoose from 'mongoose';
import { connectMongoDB } from '@/lib/mongodb';
import Product from '@/models/Product';

// В Next.js 15/16 кэширование GET-запросов изменилось.
// 'force-dynamic' гарантирует, что мы всегда получаем свежие данные из БД, а не кэш.
export const dynamic = 'force-dynamic';

// 👇 Утилита очистки путей изображений (унифицированная для всего проекта)
const fixImage = (img) => {
  if (!img) return null;
  let clean = img.toString().trim();
=======
import { connectMongoDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d

export async function GET(request, { params }) {
  try {
    await connectMongoDB();
<<<<<<< HEAD
    
    // 🔥 ВАЖНО для Next.js 16: params — это Promise, его нужно ждать!
    const { id } = await params; 

    // Проверка валидности ID перед запросом в БД
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const product = await Product.findById(id).lean();
=======
    const { id } = params;

    const product = await Product.findById(id);
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

<<<<<<< HEAD
    // Формируем ответ, обрабатывая и старые, и новые поля (обратная совместимость)
=======
    const fixImage = (img) => {
      if (!img) return null;
      let clean = img.toString().trim();
      if (clean.includes('/api/images/http')) clean = clean.replace('/api/images/', '');
      if (clean.startsWith('http') || clean.startsWith('/')) return clean;
      return `/api/images/${clean}`;
    };

    // Формируем ответ с новыми полями
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
    const enhancedProduct = {
      ...product.toObject(),
      _id: product._id.toString(),
      
      // Стандартные изображения
      image: fixImage(product.image),
      imageLarge: fixImage(product.imageLarge),
<<<<<<< HEAD
      
      // 🔥 AI поля: поддержка и старого одиночного поля, и нового массива
      tryOnImage: fixImage(product.tryOnImage),
      tryOnImages: Array.isArray(product.tryOnImages) ? product.tryOnImages.map(fixImage) : [],
      
      // Галерея
      additionalImages: Array.isArray(product.additionalImages) ? product.additionalImages.map(fixImage) : []
=======
      // 🔥 ВАЖНО: Возвращаем tryOnImage
      tryOnImage: fixImage(product.tryOnImage), 
      // aiCategory вернется автоматически, т.к. это просто строка
      additionalImages: product.additionalImages?.map(fixImage) || []
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
    };

    return NextResponse.json(enhancedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
<<<<<<< HEAD

export async function PUT(req, { params }) {
  try {
    await connectMongoDB();
    
    // 🔥 Next.js 16: ждем params
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    const productData = await req.json();
    
    // Обновляем товар (Mongoose сам обработает новые поля схемы из productData)
    const updatedProduct = await Product.findByIdAndUpdate(id, productData, { new: true });
    
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error.message);
    return NextResponse.json({ error: 'Failed to update product', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoDB();
    
    // 🔥 Next.js 16: ждем params
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    return NextResponse.json({ error: 'Failed to delete product', details: error.message }, { status: 500 });
  }
}
=======
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
