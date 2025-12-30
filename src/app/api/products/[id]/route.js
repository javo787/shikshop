import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from '@/lib/mongodb'; // Используем правильный импорт через @
import Product from '@/models/Product'; // Используем правильный импорт через @

// 👇 Функция очистки изображений (точно такая же, как в products/route.js)
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

export async function GET(req, { params }) {
  try {
    await connectMongoDB();
    
    // В Next.js 15 params нужно ждать!
    const { id } = await params; 

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const product = await Product.findById(id).lean(); // .lean() ускоряет запрос

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Применяем ту же логику исправления картинок, что и в каталоге
    const enhancedProduct = {
      ...product,
      _id: product._id.toString(),
      image: fixImage(product.image),
      imageLarge: fixImage(product.imageLarge),
      additionalImages: product.additionalImages?.map(fixImage) || []
    };

    return NextResponse.json(enhancedProduct);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    return NextResponse.json({ error: 'Failed to fetch product', details: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongoDB();
    
    // В Next.js 15 params нужно ждать!
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    
    const productData = await req.json();
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
    
    // В Next.js 15 params нужно ждать!
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