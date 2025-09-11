import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from '../../../../lib/mongodb';
import Product from '../../../../models/Product';

export async function GET(request, context) {
  try {
    const params = await context.params; // Await params
    const { id } = params;
    if (!id) {
      console.error('ID параметр отсутствует');
      return NextResponse.json({ error: 'ID параметр отсутствует' }, { status: 400 });
    }

    await connectMongoDB();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({
      ...product,
      image: product.image ? `/api/images/${product.image}` : null,
      imageLarge: product.imageLarge ? `/api/images/${product.imageLarge}` : null,
      additionalImages: (product.additionalImages || []).map(id => `/api/images/${id}`),
    });
  } catch (error) {
    console.error('Error fetching product:', error.message);
    return NextResponse.json({ error: 'Failed to fetch product', details: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const { gfs } = await connectMongoDB();
    if (!gfs) {
      console.error('GridFS не инициализирован');
      return NextResponse.json({ error: 'GridFS не инициализирован' }, { status: 500 });
    }
    const params = await context.params; // Await params
    const { id } = params;
    if (!id) {
      console.error('ID параметр отсутствует');
      return NextResponse.json({ error: 'ID параметр отсутствует' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    const formData = await request.formData();
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price') ? parseFloat(formData.get('price')) : null,
      category: formData.get('category') || null,
      type: formData.get('type') || 'product',
      material: formData.get('material') || null,
      sizes: formData.get('sizes') || null,
      details: formData.get('details') || null,
    };

    let imageId = null;
    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const imageStream = gfs.openUploadStream(imageFile.name, { contentType: imageFile.type });
      imageStream.write(imageBuffer);
      imageStream.end();
      imageId = await new Promise((resolve, reject) => {
        imageStream.on('finish', () => resolve(imageStream.id));
        imageStream.on('error', reject);
      });
    }

    let imageLargeId = null;
    const imageLargeFile = formData.get('imageLarge');
    if (imageLargeFile && imageLargeFile.size > 0) {
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
      if (file && file.size > 0) {
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

    const updateData = {
      ...data,
      ...(imageId && { image: imageId }),
      ...(imageLargeId && { imageLarge: imageLargeId }),
      ...(additionalImageIds.length > 0 && { additionalImages: additionalImageIds }),
    };

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        ...product,
        image: product.image ? `/api/images/${product.image}` : null,
        imageLarge: product.imageLarge ? `/api/images/${product.imageLarge}` : null,
        additionalImages: (product.additionalImages || []).map(id => `/api/images/${id}`),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating product:', error.message);
    return NextResponse.json({ error: 'Failed to update product', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await connectMongoDB();
    const params = await context.params; // Await params
    const { id } = params;
    if (!id) {
      console.error('ID параметр отсутствует');
      return NextResponse.json({ error: 'ID параметр отсутствует' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    return NextResponse.json({ error: 'Failed to delete product', details: error.message }, { status: 500 });
  }
}