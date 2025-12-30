import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  try {
    // Получаем данные от фронтенда
    const { firebaseUid, email, name, phone } = await req.json();

    if (!firebaseUid || !email) {
      return NextResponse.json({ error: 'Не хватает данных' }, { status: 400 });
    }

    await connectMongoDB();

    // Ищем пользователя, если нет — создаем (upsert: true)
    const user = await User.findOneAndUpdate(
      { firebaseUid }, 
      { 
        email,
        // $setOnInsert обновляет поля только при СОЗДАНИИ новой записи
        $setOnInsert: { 
          name: name || '',
          phone: phone || '',
          role: 'user',
          address: ''
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: 'User synced', user }, { status: 200 });
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}