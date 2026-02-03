import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import LoginRequest from '@/models/LoginRequest';

// Токен бота
const BOT_TOKEN = process.env.TELEGRAM_LOGIN_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req) {
  try {
    const update = await req.json();
    
    // Проверяем, что это сообщение
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const text = update.message.text;
    const chatId = update.message.chat.id;

    // Ловим команду /start КОД
    if (text.startsWith('/start ')) {
      const code = text.split(' ')[1]; // Берем код после пробела

      if (code) {
        await connectMongoDB();
        
        // Ищем запрос с этим кодом
        const request = await LoginRequest.findOne({ code });

        if (request) {
          // ЗАПИСЫВАЕМ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
          request.status = 'success';
          request.telegramUser = {
            id: update.message.from.id,
            first_name: update.message.from.first_name,
            last_name: update.message.from.last_name,
            username: update.message.from.username,
            photo_url: null // Бот не видит фото сразу, но это не страшно
          };
          await request.save();

          // Отвечаем пользователю в Telegram
          await sendTelegramMessage(chatId, "✅ Вы успешно вошли на сайт! Можете возвращаться в браузер.");
        } else {
          await sendTelegramMessage(chatId, "⚠️ Срок действия ссылки истек. Попробуйте снова на сайте.");
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ ok: true }); // Всегда отвечаем 200, чтобы Telegram не спамил
  }
}

// Функция отправки ответа
async function sendTelegramMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}