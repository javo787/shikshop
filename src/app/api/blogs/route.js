import { NextResponse } from 'next/server';
import { connectMongoDB } from '../../../lib/mongodb';
import Blog from '../../../models/Blog'; // Импорт модели

export async function GET() {
  try {
    await connectMongoDB();
    const blogs = await Blog.find({});
    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongoDB();
    const blogData = await req.json(); // JSON с URL
    const newBlog = new Blog(blogData);
    await newBlog.save();
    return NextResponse.json(newBlog, { status: 201 });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectMongoDB();
    const blogData = await req.json();
    const { id, ...updateData } = blogData;
    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectMongoDB();
    const { id } = await req.json();
    const deletedBlog = await Blog.findByIdAndDelete(id);
    if (!deletedBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Blog deleted' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}