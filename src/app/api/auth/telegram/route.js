import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminAuth } from '@/lib/firebaseAdmin';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req) {
  try {
    const data = await req.json();
    const { hash, ...userData } = data;

    // 👇 ИЗМЕНЕНИЕ: Используем СПЕЦИАЛЬНЫЙ токен для логина
    // Если его нет, пробуем старый (на всякий случай), но лучше настроить новый
    const token = process.env.TELEGRAM_LOGIN_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.error('Ошибка: Не найден TELEGRAM_LOGIN_TOKEN в .env');
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    // Проверка хеша (все как раньше)
    const secretKey = crypto.createHash('sha256').update(token).digest();
    const checkString = Object.keys(userData).sort().map(k => `${k}=${userData[k]}`).join('\n');
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (hmac !== hash) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    }

    // ... (Дальше код создания пользователя MongoDB и Firebase такой же, как был) ...
    // Я оставлю его кратким для удобства копирования:

    await connectMongoDB();
    const telegramId = userData.id.toString();

    let user = await User.findOne({ 'providers.telegram.id': telegramId });

    if (!user) {
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
        }
      });
    }

    const firebaseUid = `tg_${telegramId}`;
    if (user.firebaseUid !== firebaseUid) {
      user.firebaseUid = firebaseUid;
      await user.save();
    }

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