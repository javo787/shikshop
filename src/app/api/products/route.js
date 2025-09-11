import { NextResponse } from 'next/server';
import {connectMongoDB} from '../../../lib/mongodb';
import Product from '../../../models/Product';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const { gfs } = await connectMongoDB();
    if (!gfs) {
      throw new Error('GridFS не инициализирован');
    }
    const products = await Product.find({}).lean();
    const productsWithImageUrls = products.map(product => ({
      ...product,
      image: `/api/images/${product.image}`,
      imageLarge: product.imageLarge ? `/api/images/${product.imageLarge}` : null,
      additionalImages: (product.additionalImages || []).map(id => `/api/images/${id}`),
    }));
    return NextResponse.json(productsWithImageUrls);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { gfs } = await connectMongoDB();
    if (!gfs) {
      throw new Error('GridFS не инициализирован');
    }
    const formData = await request.formData();
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price') ? parseFloat(formData.get('price')) : undefined,
      category: formData.get('category') || undefined,
      type: formData.get('type') || 'product',
      style: formData.get('style') || undefined,
      material: formData.get('material') || undefined,
      sizes: formData.get('sizes') || undefined,
      details: formData.get('details') || undefined,
    };

    const imageFile = formData.get('image');
    if (!imageFile) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageStream = gfs.openUploadStream(imageFile.name, { contentType: imageFile.type });
    imageStream.write(imageBuffer);
    imageStream.end();
    const imageId = await new Promise((resolve, reject) => {
      imageStream.on('finish', () => resolve(imageStream.id));
      imageStream.on('error', reject);
    });

    let imageLargeId = null;
    const imageLargeFile = formData.get('imageLarge');
    if (imageLargeFile) {
      const imageLargeBuffer = Buffer.from(await imageLargeFile.arrayBuffer());
      const imageLargeStream = gfs.openUploadStream(imageLargeFile.name, { contentType: imageLargeFile.type });
      imageLargeStream.write(imageLargeBuffer);
      imageLargeStream.end();
      imageLargeId = await new Promise((resolve, reject) => {
        imageLargeStream.on('finish', () => resolve(imageLargeStream.id));
        imageLargeStream.on('error', reject);
      });
    }

    const additionalImageFiles = formData.getAll('additionalImages');
    const additionalImageIds = [];
    for (const file of additionalImageFiles) {
      if (file && file.size > 0) { // Проверка, что файл не пустой
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = gfs.openUploadStream(file.name, { contentType: file.type });
        stream.write(buffer);
        stream.end();
        const fileId = await new Promise((resolve, reject) => {
          stream.on('finish', () => resolve(stream.id));
          stream.on('error', reject);
        });
        additionalImageIds.push(fileId);
      }
    }

    const product = new Product({
      ...data,
      image: imageId,
      imageLarge: imageLargeId,
      additionalImages: additionalImageIds,
    });
    await product.save();

    return NextResponse.json(
      {
        ...product.toObject(),
        image: `/api/images/${imageId}`,
        imageLarge: imageLargeId ? `/api/images/${imageLargeId}` : null,
        additionalImages: additionalImageIds.map(id => `/api/images/${id}`),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectMongoDB();
    const id = params.id;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    const result = await Product.deleteOne({ _id: id });
    if (result.deletedCount === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectMongoDB();
    const id = params.id;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    const formData = await request.formData();
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price') ? parseFloat(formData.get('price')) : undefined,
      category: formData.get('category') || undefined,
      type: formData.get('type') || 'product',
      style: formData.get('style') || undefined,
      material: formData.get('material') || undefined,
      sizes: formData.get('sizes') || undefined,
      details: formData.get('details') || undefined,
    };

    // Если новое изображение, обновляем
    const imageFile = formData.get('image');
    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const imageStream = gfs.openUploadStream(imageFile.name, { contentType: imageFile.type });
      imageStream.write(imageBuffer);
      imageStream.end();
      data.image = await new Promise((resolve, reject) => {
        imageStream.on('finish', () => resolve(imageStream.id));
        imageStream.on('error', reject);
      });
    }

    // Аналогично для imageLarge и additionalImages
    const imageLargeFile = formData.get('imageLarge');
    if (imageLargeFile) {
      const imageLargeBuffer = Buffer.from(await imageLargeFile.arrayBuffer());
      const imageLargeStream = gfs.openUploadStream(imageLargeFile.name, { contentType: imageLargeFile.type });
      imageLargeStream.write(imageLargeBuffer);
      imageLargeStream.end();
      data.imageLarge = await new Promise((resolve, reject) => {
        imageLargeStream.on('finish', () => resolve(imageLargeStream.id));
        imageLargeStream.on('error', reject);
      });
    }

    const additionalImageFiles = formData.getAll('additionalImages');
    if (additionalImageFiles.length > 0) {
      data.additionalImages = [];
      for (const file of additionalImageFiles) {
        if (file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const stream = gfs.openUploadStream(file.name, { contentType: file.type });
          stream.write(buffer);
          stream.end();
          const fileId = await new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(stream.id));
            stream.on('error', reject);
          });
          data.additionalImages.push(fileId);
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true });
    if (!updatedProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}