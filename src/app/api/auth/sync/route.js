import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  try {
    // Получаем все возможные данные (email и name могут быть null)
    const { uid, phone, email, name } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'Missing UID' }, { status: 400 });
    }

    await connectMongoDB();

    // 1. Ищем пользователя по UID
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // 2. Если не нашли по UID, ищем по телефону (если он передан)
      if (phone) {
        user = await User.findOne({ phone: phone });
      }
      
      // 3. Или по email (если он передан)
      if (!user && email) {
        user = await User.findOne({ email: email });
      }

      if (user) {
        // --- СЦЕНАРИЙ: ПОЛЬЗОВАТЕЛЬ НАЙДЕН (ОБНОВЛЯЕМ) ---
        user.firebaseUid = uid;
        // Обновляем поля, только если они пришли новые и в базе пусто
        if (phone && !user.phone) user.phone = phone;
        if (email && !user.email) user.email = email;
        if (name && !user.name) user.name = name;
        
        await user.save();
      } else {
        // --- СЦЕНАРИЙ: НОВЫЙ ПОЛЬЗОВАТЕЛЬ (СОЗДАЕМ) ---
        // Формируем объект динамически. НЕЛЬЗЯ писать email: ''
        const newUserObj = {
          firebaseUid: uid,
          role: 'user',
          address: '',
          image: '',
          favorites: []
        };

        if (phone) newUserObj.phone = phone;
        if (email) newUserObj.email = email; // Добавится только если email существует
        if (name) newUserObj.name = name;

        user = await User.create(newUserObj);
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}