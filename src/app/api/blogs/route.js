import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectMongoDB } from '@/src/lib/mongodb';

export async function GET(request) {
  try {
    const { conn } = await connectMongoDB();
    const database = conn.connection.db;
    const blogs = database.collection('blogs');
    
    const url = new URL(request.url);
    const full = url.searchParams.get('full') === 'true'; // Полный контент, если ?full=true
    const result = await blogs.find({}).limit(10).toArray();
    
    const optimizedBlogs = result.map(blog => ({
      _id: blog._id,
      title: blog.title,
      content: full ? blog.content : (blog.content.substring(0, 100) + '...'), // Обрезаем до 100 символов для превью
      image: full ? blog.image : (blog.image ? blog.image.substring(0, 100) + '...' : null), // Обрезаем base64 для превью
      date: blog.date,
    }));
    
    return NextResponse.json(optimizedBlogs);
  } catch (error) {
    console.error('API: Error fetching blogs', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { conn } = await connectMongoDB();
    const database = conn.connection.db;
    const blogs = database.collection('blogs');
    const result = await blogs.insertOne({
      title: data.title,
      content: data.content,
      image: data.image, // Base64 string
      date: data.date || new Date().toISOString().split('T')[0],
    });
    return NextResponse.json({ message: 'Blog created', id: result.insertedId });
  } catch (error) {
    console.error('API: Error creating blog', error);
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { conn } = await connectMongoDB();
    const database = conn.connection.db;
    const blogs = database.collection('blogs');
    const result = await blogs.updateOne(
      { _id: new ObjectId(data.id) },
      { $set: { title: data.title, content: data.content, image: data.image, date: data.date } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Blog updated' });
  } catch (error) {
    console.error('API: Error updating blog', error);
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const { conn } = await connectMongoDB();
    const database = conn.connection.db;
    const blogs = database.collection('blogs');
    const result = await blogs.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Blog deleted' });
  } catch (error) {
    console.error('API: Error deleting blog', error);
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}