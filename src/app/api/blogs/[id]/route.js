import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Blog from '@/models/Blog';
import mongoose from 'mongoose'; // Импортируем mongoose для проверки валидности ID

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    await connectMongoDB();
    
    let blog = null;

    // Проверяем, является ли id валидным ObjectId MongoDB
    // Если да, ищем и по _id, и по slug (на всякий случай)
    if (mongoose.Types.ObjectId.isValid(id)) {
      blog = await Blog.findOne({
        $or: [{ _id: id }, { slug: id }]
      });
    } else {
      // Если это не ObjectId (значит это просто текст/slug), ищем только по slug
      blog = await Blog.findOne({ slug: id });
    }

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error('API: Error fetching blog details', error);
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}