import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  try {
    const { uid, phone } = await req.json();
    
    if (!uid || !phone) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    await connectMongoDB();

    // 1. Ищем пользователя по UID Firebase
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // 2. Если не нашли по UID, ищем по телефону (вдруг админ создал его вручную или был старый заказ)
      user = await User.findOne({ phone: phone });

      if (user) {
        // Нашли по телефону -> обновляем UID, чтобы связать аккаунты
        user.firebaseUid = uid;
        await user.save();
      } else {
        // 3. Совсем новый пользователь -> создаем
        user = await User.create({
          firebaseUid: uid,
          phone: phone,
          name: '', // Имя клиент заполнит в корзине
          email: '', 
          role: 'user',
          address: ''
        });
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth Sync Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}