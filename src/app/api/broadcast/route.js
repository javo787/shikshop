// src/app/api/admin/broadcast/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Subscriber from '@/models/Subscriber';
import User from '@/models/User'; // Импортируем модель пользователей
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  try {
    await dbConnect();
    const { subject, message, testEmail } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Заполните тему и сообщение' }, { status: 400 });
    }

    // --- ТЕСТОВАЯ ОТПРАВКА ---
    if (testEmail) {
        await sendEmail({
            to: testEmail,
            subject: `[TEST] ${subject}`,
            html: message,
        });
        return NextResponse.json({ message: `Тестовое письмо отправлено на ${testEmail}` });
    }

    // --- СБОР АДРЕСАТОВ ---
    
    // 1. Получаем подписчиков из футера
    const subscribers = await Subscriber.find({ isActive: true }).select('email');
    
    // 2. Получаем зарегистрированных пользователей, у которых есть email
    // (Можно добавить фильтр, например { role: 'user' }, если нужно)
    const users = await User.find({ email: { $exists: true, $ne: '' } }).select('email');

    // 3. Объединяем и убираем дубликаты используя Set
    const uniqueEmails = new Set();

    subscribers.forEach(sub => {
        if (sub.email) uniqueEmails.add(sub.email.toLowerCase().trim());
    });

    users.forEach(user => {
        if (user.email) uniqueEmails.add(user.email.toLowerCase().trim());
    });

    // Превращаем Set обратно в массив
    const recipients = Array.from(uniqueEmails);
    
    if (recipients.length === 0) {
        return NextResponse.json({ message: 'Нет адресатов для рассылки' });
    }

    // --- ОТПРАВКА ---
    let successCount = 0;
    let failCount = 0;

    console.log(`Начинаем рассылку для ${recipients.length} уникальных адресов...`);

    for (const email of recipients) {
        try {
            await sendEmail({
                to: email,
                subject: subject,
                html: message,
            });
            successCount++;
        } catch (err) {
            console.error(`Не удалось отправить на ${email}:`, err);
            failCount++;
        }
    }

    return NextResponse.json({ 
        message: 'Рассылка завершена', 
        stats: { 
            totalUnique: recipients.length, 
            subscribersSource: subscribers.length,
            usersSource: users.length,
            sent: successCount, 
            failed: failCount 
        } 
    });

  } catch (error) {
    console.error('Ошибка рассылки:', error);
    return NextResponse.json({ error: 'Ошибка сервера при рассылке' }, { status: 500 });
  }
}