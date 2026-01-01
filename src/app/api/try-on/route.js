import Replicate from "replicate";
import { NextResponse } from "next/server";
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import TryOnLog from '@/models/TryOnLog';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { personImage, garmentImage, userId } = await req.json();

    // --- 1. ЛОГИКА ПРОВЕРКИ ЛИМИТОВ ---
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await connectMongoDB();

    // А) Если пользователь зарегистрирован (userId пришел с фронта)
    if (userId) {
      const user = await User.findById(userId);
      
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (user.isBlocked) return NextResponse.json({ error: 'Ваш аккаунт заблокирован' }, { status: 403 });

      if (user.tryOnBalance <= 0) {
        // Логируем попытку как заблокированную
        await TryOnLog.create({ userId, ipAddress: ip, status: 'blocked', userAgent });
        return NextResponse.json({ 
          error: 'LIMIT_REACHED_BUY', 
          message: 'Лимит исчерпан. Оформите заказ, чтобы получить 30 попыток!' 
        }, { status: 403 });
      }

      // Списываем 1 попытку
      user.tryOnBalance -= 1;
      await user.save();
      
      // Логируем успешный запуск
      await TryOnLog.create({ userId, ipAddress: ip, status: 'success', userAgent });
    } 
    
    // Б) Если это гость (без регистрации)
    else {
      // Проверяем, сколько раз этот IP использовал функцию без входа
      const usageCount = await TryOnLog.countDocuments({ 
        ipAddress: ip, 
        userId: null, 
        status: 'success'
      });

      if (usageCount >= 1) { // Лимит для гостей = 1
        return NextResponse.json({ 
          error: 'LIMIT_REACHED_GUEST', 
          message: 'Бесплатная попытка использована. Зарегистрируйтесь, чтобы получить еще 3!' 
        }, { status: 403 });
      }

      // Логируем использование гостем
      await TryOnLog.create({ userId: null, ipAddress: ip, status: 'success', userAgent });
    }

    // --- 2. ЗАПУСК НЕЙРОСЕТИ (REPLICATE) ---
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Нет фото" }, { status: 400 });
    }

    const prediction = await replicate.predictions.create({
      version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
      input: {
        crop: true, // ✅ ВКЛЮЧЕНО: Автоматическая обрезка
        seed: 42,
        steps: 30,
        category: "upper_body",
        force_dc: false,
        garm_img: garmentImage,
        human_img: personImage,
        mask_only: false,
        garment_des: "clothing",
      }
    });

    // Получаем актуальный баланс для возврата на фронтенд
    let remaining = 0;
    if (userId) {
       const updatedUser = await User.findById(userId);
       remaining = updatedUser ? updatedUser.tryOnBalance : 0;
    }

    // Возвращаем ID задачи, предупреждение и оставшиеся попытки
    return NextResponse.json({
      ...prediction,
      warning: "Загруженное изображение не в формате 3:4. Система автоматически обрезала его.",
      remaining: remaining
    });

  } catch (error) {
    console.error("Try-On API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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