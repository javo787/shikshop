import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    // В идеале тут нужно проверить, что запрашивает Админ, 
    // но пока сделаем просто получение всех.
    await connectMongoDB();
    
    // Получаем всех пользователей, сортируем по дате регистрации (сначала новые)
    const users = await User.find().sort({ createdAt: -1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}