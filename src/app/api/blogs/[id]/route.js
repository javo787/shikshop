import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/src/lib/mongodb';

export async function GET(request, { params }) {
  const { id } = await params; // Await params to access id

  try {
    const { conn } = await connectMongoDB();
    const database = conn.connection.db;
    const blogs = database.collection('blogs');
    const blog = await blogs.findOne({ _id: new ObjectId(id) });

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error('API: Error fetching blog', error);
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}