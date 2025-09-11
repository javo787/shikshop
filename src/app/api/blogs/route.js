import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/src/lib/mongodb';

export async function GET() {
  try {
    const { conn } = await connectMongoDB();
    const database = conn.connection.db;
    const blogs = database.collection('blogs');
    const result = await blogs.find({}).toArray();
    return NextResponse.json(result);
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