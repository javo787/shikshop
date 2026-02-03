import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb'; // ИСПРАВЛЕНО
import Subscriber from '@/models/Subscriber';

export async function POST(req) {
  try {
    await connectMongoDB(); // ИСПРАВЛЕНО
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Неверный формат email' }, { status: 400 });
    }

    // Проверяем, есть ли уже такой подписчик
    const existingSubscriber = await Subscriber.findOne({ email });

    if (existingSubscriber) {
        if (!existingSubscriber.isActive) {
            // Если был отписан, подписываем снова
            existingSubscriber.isActive = true;
            await existingSubscriber.save();
            return NextResponse.json({ message: 'Вы снова подписаны на новости!' }, { status: 200 });
        }
        return NextResponse.json({ message: 'Вы уже подписаны' }, { status: 200 });
    }

    // Создаем нового
    await Subscriber.create({ email });

    return NextResponse.json({ message: 'Успешная подписка!' }, { status: 201 });
  } catch (error) {
    console.error('Ошибка подписки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}