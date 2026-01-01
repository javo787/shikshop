import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  try {
    const { userId, block } = await req.json(); // block = true/false
    await connectMongoDB();

    const user = await User.findByIdAndUpdate(
      userId, 
      { isBlocked: block },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: block ? 'Пользователь заблокирован' : 'Пользователь разблокирован', 
      user 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}