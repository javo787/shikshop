import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product'; // Нужно для подгрузки избранных товаров

// GET: Получить данные пользователя
export async function GET(request, { params }) {
  try {
    const { uid } = await params; // firebaseUid
    await connectMongoDB();

    // Ищем пользователя
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Если у пользователя есть избранное, нужно найти эти товары в базе
    let favoritesData = [];
    if (user.favorites && user.favorites.length > 0) {
      favoritesData = await Product.find({ _id: { $in: user.favorites } });
    }

    // Возвращаем данные пользователя + полные данные об избранных товарах
    return NextResponse.json({ ...user.toObject(), favoritesData }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PUT: Обновить данные пользователя (Имя, Телефон, Адрес)
export async function PUT(request, { params }) {
  try {
    const { uid } = await params;
    const body = await request.json();
    
    await connectMongoDB();

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { 
        $set: {
          name: body.name,
          phone: body.phone,
          address: body.address,
        }
      },
      { new: true } // Вернуть обновленный документ
    );

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 });
  }
}