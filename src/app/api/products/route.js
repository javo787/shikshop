import { NextResponse } from 'next/server';
import { connectMongoDB } from '../../../lib/mongodb';
import Product from '../../../models/Product';

export async function GET() {
  try {
    await connectMongoDB();
    const products = await Product.find({});
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoDB();
    const productData = await req.json(); // JSON с URL
    const newProduct = new Product(productData);
    await newProduct.save();
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}