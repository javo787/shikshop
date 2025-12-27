import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(req, { params }) {
  try {
    await connectMongoDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 👇 МОЩНАЯ ФУНКЦИЯ ОЧИСТКИ
    const fixImage = (img) => {
      if (!img) return null;
      let clean = img.toString().trim();

      if (clean.includes('/api/images/http')) {
        clean = clean.replace('/api/images/', '');
      }

      if (clean.startsWith('http') || clean.startsWith('/')) return clean;
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

    return NextResponse.json(enhancedProduct);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongoDB();
    const { id } = await params;
    const data = await req.json();
    const updated = await Product.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectMongoDB();
    const { id } = await params;
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}