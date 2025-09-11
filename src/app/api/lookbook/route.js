import { NextResponse } from 'next/server';
import { connectMongoDB } from '../../../lib/mongodb';
import Product from '../../../models/Product';

export async function GET() {
  try {
    const { gfs } = await connectMongoDB();
    if (!gfs) {
      throw new Error('GridFS не инициализирован');
    }
    const looks = await Product.find({ type: 'look' }).lean();
    const looksWithImageUrls = looks.map(look => ({
      ...look,
      image: look.image ? `/api/images/${look.image}` : null,
      imageLarge: look.imageLarge ? `/api/images/${look.imageLarge}` : null,
      additionalImages: look.additionalImages
        ? look.additionalImages.map(id => `/api/images/${id}`)
        : [],
    }));
    return NextResponse.json(looksWithImageUrls);
  } catch (error) {
    console.error('Error fetching lookbook:', error);
    return NextResponse.json({ error: 'Failed to fetch lookbook' }, { status: 500 });
  }
}