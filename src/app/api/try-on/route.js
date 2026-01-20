import Replicate from "replicate";
import { NextResponse } from "next/server";
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import TryOnLog from '@/models/TryOnLog';

<<<<<<< HEAD
// Гарантируем, что Next.js не закэширует этот роут
=======
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
<<<<<<< HEAD
    // 1. Получаем данные и категорию (важно для платьев)
    // По умолчанию 'upper_body', если категория не передана
=======
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
    const { personImage, garmentImage, userId, category = "upper_body" } = await req.json();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Не загружены необходимые фото" }, { status: 400 });
    }

    await connectMongoDB();

<<<<<<< HEAD
    // --- 2. ПРОВЕРКА ЛИМИТОВ И СПИСАНИЕ ---
    if (userId) {
      // А) Для зарегистрированных пользователей
=======
    // --- 1. ПРОВЕРКА ЛИМИТОВ ---
    if (userId) {
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
      const user = await User.findOne({ firebaseUid: userId });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (user.isBlocked) return NextResponse.json({ error: 'Blocked' }, { status: 403 });
      
<<<<<<< HEAD
      if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      if (user.isBlocked) {
          return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
      }
      
      if (user.tryOnBalance <= 0) {
        await TryOnLog.create({ userId: user._id, ipAddress: ip, status: 'blocked', userAgent });
        return NextResponse.json({ 
            error: 'LIMIT_REACHED_BUY', 
            message: 'Лимит исчерпан. Оформите заказ для пополнения.' 
        }, { status: 403 });
=======
      if (user.tryOnBalance <= 0) {
        await TryOnLog.create({ userId: user._id, ipAddress: ip, status: 'blocked', userAgent });
        return NextResponse.json({ error: 'LIMIT_REACHED_BUY', message: 'Лимит исчерпан.' }, { status: 403 });
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
      }
      user.tryOnBalance -= 1;
      await user.save();
<<<<<<< HEAD
      
      // Логируем успех
      await TryOnLog.create({ userId: user._id, ipAddress: ip, status: 'success', userAgent });

    } else {
      // Б) Для гостей (по IP)
      const usageCount = await TryOnLog.countDocuments({ 
          ipAddress: ip, 
          userId: null, 
          status: 'success' 
      });

      if (usageCount >= 1) { 
        return NextResponse.json({ 
            error: 'LIMIT_REACHED_GUEST', 
            message: 'Гостевой лимит исчерпан. Зарегистрируйтесь, чтобы продолжить.' 
        }, { status: 403 });
=======
      await TryOnLog.create({ userId: user._id, ipAddress: ip, status: 'success', userAgent });
    } else {
      const usageCount = await TryOnLog.countDocuments({ ipAddress: ip, userId: null, status: 'success' });
      if (usageCount >= 1) { 
        return NextResponse.json({ error: 'LIMIT_REACHED_GUEST', message: 'Гостевой лимит исчерпан.' }, { status: 403 });
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
      }
      await TryOnLog.create({ userId: null, ipAddress: ip, status: 'success', userAgent });
    }

<<<<<<< HEAD
    // --- 3. ЗАПУСК НЕЙРОСЕТИ (IDM-VTON Latest) ---
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    
    // Генерируем случайный seed для вариативности
    const randomSeed = Math.floor(Math.random() * 2147483647);
    
    // Промпт для высокого качества
    const PRO_PROMPT = "high quality realistic clothing, detailed fabric texture, professional fashion photography, 4k, natural lighting, high fidelity";

    console.log(`🚀 Запуск AI | Категория: ${category} | User: ${userId || 'Guest'}`);

    const prediction = await replicate.predictions.create({
      // IDM-VTON (Стабильная версия)
      version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985", 
      input: {
        steps: 30, // Оптимальный баланс скорости и качества
        crop: false, // ⚠️ ВАЖНО: false, чтобы не обрезать длинные платья
        seed: randomSeed,
        category: category, // Передаем категорию (dresses, upper_body, lower_body)
=======
    // --- 2. ЗАПУСК НЕЙРОСЕТИ (IDM-VTON Latest) ---
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const randomSeed = Math.floor(Math.random() * 2147483647);
    const PRO_PROMPT = "high quality realistic clothing, detailed fabric texture, professional fashion photography, 4k, natural lighting";

    console.log("🚀 Запуск IDM-VTON (Latest) с категорией:", category);

    const prediction = await replicate.predictions.create({
      // ✅ АКТУАЛЬНЫЙ ID С САЙТА (Latest)
      version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985", 
      input: {
        steps: 30, 
        crop: false, // ⚠️ ВАЖНО: false, чтобы не резало платья
        seed: randomSeed,
        category: category, 
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
        force_dc: false,
        garm_img: garmentImage,
        human_img: personImage,
        garment_des: PRO_PROMPT,
      }
    });

<<<<<<< HEAD
    // Получаем актуальный остаток попыток для UI
=======
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
    let remaining = 0;
    if (userId) {
       const updatedUser = await User.findOne({ firebaseUid: userId });
       remaining = updatedUser ? updatedUser.tryOnBalance : 0;
    }

    return NextResponse.json({ ...prediction, remaining });

  } catch (error) {
<<<<<<< HEAD
    console.error("❌ Try-On API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// GET метод для проверки статуса генерации (Polling)
=======
    console.error("Try-On Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
<<<<<<< HEAD
    
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });
=======
    if (!id) return NextResponse.json({ error: "No ID" }, { status: 400 });
>>>>>>> 8d4ccfa01d12cb616eeaa127454ef95d9fd06c6d

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const prediction = await replicate.predictions.get(id);
    
    return NextResponse.json(prediction);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
