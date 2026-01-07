import Replicate from "replicate";
import { NextResponse } from "next/server";
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import TryOnLog from '@/models/TryOnLog';

// Отключаем кэширование, чтобы каждый запрос был новым
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { personImage, garmentImage, userId } = await req.json();

    // --- 1. ПРОВЕРКА ЛИМИТОВ И БЕЗОПАСНОСТЬ ---
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Не загружены фото" }, { status: 400 });
    }

    await connectMongoDB();

    // А) Логика для зарегистрированных
    if (userId) {
      // Ищем по firebaseUid
      const user = await User.findOne({ firebaseUid: userId });
      
      if (!user) {
         return NextResponse.json({ error: 'User profile not found. Try re-login.' }, { status: 404 });
      }

      if (user.isBlocked) return NextResponse.json({ error: 'Ваш аккаунт заблокирован' }, { status: 403 });

      if (user.tryOnBalance <= 0) {
        await TryOnLog.create({ userId: user._id, ipAddress: ip, status: 'blocked', userAgent });
        return NextResponse.json({ 
          error: 'LIMIT_REACHED_BUY', 
          message: 'Лимит исчерпан. Оформите заказ, чтобы получить 30 попыток!' 
        }, { status: 403 });
      }

      // Списываем баланс
      user.tryOnBalance -= 1;
      await user.save();
      
      await TryOnLog.create({ userId: user._id, ipAddress: ip, status: 'success', userAgent });
    } 
    // Б) Логика для гостей
    else {
      const usageCount = await TryOnLog.countDocuments({ 
        ipAddress: ip, 
        userId: null, 
        status: 'success'
      });

      if (usageCount >= 1) { 
        return NextResponse.json({ 
          error: 'LIMIT_REACHED_GUEST', 
          message: 'Гостевой лимит исчерпан.' 
        }, { status: 403 });
      }

      await TryOnLog.create({ userId: null, ipAddress: ip, status: 'success', userAgent });
    }

    // --- 2. НАСТРОЙКА НЕЙРОСЕТИ (PRO РЕЖИМ) ---
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Генерация случайного зерна (Seed), чтобы при повторной попытке результат менялся
    const randomSeed = Math.floor(Math.random() * 2147483647);

    // Магический промпт для улучшения качества
    // Мы не можем использовать negative_prompt в этой версии модели, 
    // поэтому вкладываем всё качество в описание.
    const PRO_PROMPT = "high quality realistic clothing, detailed fabric texture, professional fashion photography, 4k uhd, natural lighting, high fidelity, best quality, award winning photo, 8k, highly detailed face";

    const prediction = await replicate.predictions.create({
      // IDM-VTON (Актуальная версия)
      version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
      input: {
        // Увеличиваем шаги для максимальной прорисовки (было 20-30)
        steps: 40, 
        
        // Автоматическая обрезка под формат
        crop: true, 
        
        // Случайный сид дает шанс исправить ошибки при повторе
        seed: randomSeed, 
        
        // Лучшая категория для платьев и кофт
        category: "upper_body",
        
        force_dc: false,
        
        // Картинки
        garm_img: garmentImage,
        human_img: personImage,
        
        // Описание (Промпт)
        garment_des: PRO_PROMPT,
      }
    });

    // Получаем остаток попыток для обновления интерфейса
    let remaining = 0;
    if (userId) {
       const updatedUser = await User.findOne({ firebaseUid: userId });
       remaining = updatedUser ? updatedUser.tryOnBalance : 0;
    }

    return NextResponse.json({
      ...prediction,
      remaining: remaining
    });

  } catch (error) {
    console.error("Try-On API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET метод для проверки статуса (Polling)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    const prediction = await replicate.predictions.get(id);
    return NextResponse.json(prediction);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}