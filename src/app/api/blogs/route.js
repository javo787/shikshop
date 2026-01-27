import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb'; // Лучше использовать алиас @
import Blog from '@/models/Blog';

// GET: Получить все блоги
export async function GET() {
  try {
    await connectMongoDB();
    // Сортируем: сначала новые (по дате или по времени создания)
    const blogs = await Blog.find({}).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

// POST: Создать новый блог
export async function POST(req) {
  try {
    const body = await req.json();
    const { title, slug, content } = body;

    // Простая валидация
    if (!title || !content || !slug) {
       return NextResponse.json({ error: 'Title, Content and Slug are required' }, { status: 400 });
    }

    await connectMongoDB();

    // Проверка на уникальность SLUG
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
        return NextResponse.json({ error: 'Такой URL (slug) уже существует!' }, { status: 400 });
    }

    const newBlog = await Blog.create(body);
    return NextResponse.json(newBlog, { status: 201 });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}

// PUT: Обновить блог
export async function PUT(req) {
  try {
    const { id, ...updateData } = await req.json();

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await connectMongoDB();
    
    // { new: true } возвращает уже обновленный документ
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

// DELETE: Удалить блог
export async function DELETE(req) {
  try {
    // Получаем ID из тела запроса (как у вас в frontend)
    const { id } = await req.json(); 

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await connectMongoDB();
    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}