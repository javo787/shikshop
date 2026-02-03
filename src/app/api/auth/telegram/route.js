import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminAuth } from '@/lib/firebaseAdmin';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  try {
    const data = await req.json();
    const { hash, ...userData } = data;

    // 1. Берем токен (приоритет у LOGIN токена, если он есть)
    const token = process.env.TELEGRAM_LOGIN_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.error('Telegram Auth Error: Token not found in .env');
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    // 2. Валидация хеша (Security Check)
    const secretKey = crypto.createHash('sha256').update(token).digest();
    const checkString = Object.keys(userData).sort().map(k => `${k}=${userData[k]}`).join('\n');
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (hmac !== hash) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    }

    // 3. Подключение к MongoDB
    await connectMongoDB();
    const telegramId = userData.id.toString();
    
    // Ищем пользователя по Telegram ID
    let user = await User.findOne({ 'providers.telegram.id': telegramId });

    if (!user) {
      // Создаем нового, если нет
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
        // Важно: MongoDB требует уникальность, поэтому ставим undefined, а не пустую строку
        email: undefined, 
        phone: undefined,
        firebaseUid: `tg_${telegramId}`
      });
    }

    // 4. Синхронизация с Firebase
    const firebaseUid = `tg_${telegramId}`;
    
    // Если Firebase UID отличается (например, старый аккаунт), обновляем
    if (user.firebaseUid !== firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
    }
    
    // Генерируем токен для входа на клиенте
    const customToken = await adminAuth.createCustomToken(firebaseUid, {
        telegram: true,
        mongoId: user._id.toString()
    });

    return NextResponse.json({ token: customToken });

  } catch (error) {
    console.error('Telegram Auth Error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}