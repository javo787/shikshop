import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Blog from '@/models/Blog';

export async function GET(request, { params }) {
  // В Next.js 15 params нужно ждать (await)
  const { id } = await params;

  try {
    await connectMongoDB();
    
    // Ищем блог по ID через Mongoose
    const blog = await Blog.findById(id);

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error('API: Error fetching blog details', error);
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}