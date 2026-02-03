import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import LoginRequest from '@/models/LoginRequest';
import User from '@/models/User';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req) {
  try {
    const { code } = await req.json();
    await connectMongoDB();

    const request = await LoginRequest.findOne({ code });

    if (!request) {
      return NextResponse.json({ status: 'not_found' });
    }

    if (request.status === 'pending') {
      return NextResponse.json({ status: 'pending' });
    }

    if (request.status === 'success' && request.telegramUser) {
      const userData = request.telegramUser;
      const telegramId = userData.id.toString();

      // --- ЛОГИКА СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ (КАК РАНЬШЕ) ---
      let user = await User.findOne({ 'providers.telegram.id': telegramId });

      if (!user) {
        user = await User.create({
          name: `${userData.first_name} ${userData.last_name || ''}`.trim(),
          username: userData.username,
          role: 'user',
          providers: {
            telegram: { id: telegramId, username: userData.username }
          },
          email: undefined,
          phone: undefined,
          firebaseUid: `tg_${telegramId}`
        });
      }

      const firebaseUid = `tg_${telegramId}`;
      if (user.firebaseUid !== firebaseUid) {
          user.firebaseUid = firebaseUid;
          await user.save();
      }

      const token = await adminAuth.createCustomToken(firebaseUid, {
          telegram: true,
          mongoId: user._id.toString()
      });

      // Удаляем использованный запрос
      await LoginRequest.deleteOne({ code });

      return NextResponse.json({ status: 'success', token });
    }

    return NextResponse.json({ status: 'error' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}