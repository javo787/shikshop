import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminAuth } from '@/lib/firebaseAdmin';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  console.log('🔶 [ServerDebug] API /api/auth/telegram вызван');

  try {
    const data = await req.json();
    console.log('🔶 [ServerDebug] Полученные данные:', data);

    const { hash, ...userData } = data;

    // 1. Проверяем токены
    const token = process.env.TELEGRAM_LOGIN_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.error('🔴 [ServerDebug] ОШИБКА: Нет токена бота в .env!');
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    console.log('🔶 [ServerDebug] Используем токен (первые 5 симв.):', token.substring(0, 5) + '...');

    // 2. Валидация хеша
    const secretKey = crypto.createHash('sha256').update(token).digest();
    const checkString = Object.keys(userData).sort().map(k => `${k}=${userData[k]}`).join('\n');
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (hmac !== hash) {
      console.error('🔴 [ServerDebug] ОШИБКА: Хеш не совпал!');
      console.error('   Ожидалось:', hmac);
      console.error('   Пришло:', hash);
      return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    }

    console.log('🟢 [ServerDebug] Хеш валиден. Подключаем БД...');

    // 3. Работа с БД
    await connectMongoDB();
    const telegramId = userData.id.toString();
    
    let user = await User.findOne({ 'providers.telegram.id': telegramId });

    if (!user) {
      console.log('🔶 [ServerDebug] Пользователь не найден, создаем нового...');
      user = await User.create({
        name: `${userData.first_name} ${userData.last_name || ''}`.trim(),
        username: userData.username,
        role: 'user',
        providers: {
          telegram: {
            id: telegramId,
            username: userData.username,
            photoUrl: userData.photo_url
          }
        },
        // Важно: ставим пустые заглушки для обязательных полей, если они есть
        email: undefined, 
        phone: undefined,
        firebaseUid: `tg_${telegramId}` // Временный UID
      });
    }

    // 4. Firebase
    const firebaseUid = `tg_${telegramId}`;
    if (user.firebaseUid !== firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
    }
    
    console.log('🔶 [ServerDebug] Создаем Custom Token для Firebase...');
    const customToken = await adminAuth.createCustomToken(firebaseUid, {
        telegram: true,
        mongoId: user._id.toString()
    });

    console.log('🟢 [ServerDebug] Всё успешно. Отправляем токен.');
    return NextResponse.json({ token: customToken });

  } catch (error) {
    console.error('🔴 [ServerDebug] Глобальная ошибка API:', error);
    return NextResponse.json({ error: 'Auth failed: ' + error.message }, { status: 500 });
  }
}