import Replicate from "replicate";
import { NextResponse } from "next/server";
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import TryOnLog from '@/models/TryOnLog';
import Wardrobe from '@/models/Wardrobe'; 
import Product from '@/models/Product';
import { sendClientResultEmail, sendAdminDebugEmail } from '@/lib/email'; 

export const dynamic = 'force-dynamic';

// --- 1. ЗАПУСК ГЕНЕРАЦИИ (POST) ---
export async function POST(req) {
  try {
    const { personImage, garmentImage, userId, category = "upper_body" } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Не загружены необходимые фото" }, { status: 400 });
    }

    await connectMongoDB();
    let currentUser = null;

    // Проверка лимитов
    if (userId) {
      currentUser = await User.findOne({ firebaseUid: userId });
      
      if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (currentUser.isBlocked) return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
      
      if (currentUser.tryOnBalance <= 0) {
        await TryOnLog.create({ userId: currentUser._id, ipAddress: ip, status: 'blocked', userAgent });
        return NextResponse.json({ error: 'LIMIT_REACHED_BUY', message: 'Лимит исчерпан.' }, { status: 403 });
      }
      
      // Списываем баланс СРАЗУ при запуске
      currentUser.tryOnBalance -= 1;
      await currentUser.save();
      await TryOnLog.create({ userId: currentUser._id, ipAddress: ip, status: 'success', userAgent });

    } else {
      const usageCount = await TryOnLog.countDocuments({ ipAddress: ip, userId: null, status: 'success' });
      if (usageCount >= 1) { 
        return NextResponse.json({ error: 'LIMIT_REACHED_GUEST', message: 'Гостевой лимит исчерпан.' }, { status: 403 });
      }
      await TryOnLog.create({ userId: null, ipAddress: ip, status: 'success', userAgent });
    }

    // Запуск Replicate
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const randomSeed = Math.floor(Math.random() * 2147483647);
    const PRO_PROMPT = "high quality, realistic texture, 8k, professional photography, soft lighting, detailed fabric";

    console.log(`🚀 Start AI | User: ${userId || 'Guest'} | Steps: 50`);

    const prediction = await replicate.predictions.create({
      version: "c871bb9b046607e58045a57f15283f1210c9b2d9a78619aec6101b730eb194c2", 
      input: {
        steps: 50,           // Высокое качество
        guidance_scale: 2.5,
        seed: randomSeed,
        category: category,
        crop: false,
        force_dc: false,
        garm_img: garmentImage,
        human_img: personImage,
        garment_des: PRO_PROMPT,
      }
    });

    // Возвращаем ID сразу (не ждем завершения)
    // Также возвращаем params, чтобы потом передать их в сохранение
    return NextResponse.json({ 
        ...prediction, 
        remaining: currentUser ? currentUser.tryOnBalance : 0,
        modelParams: { steps: 50, seed: randomSeed } 
    });

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. ПРОВЕРКА СТАТУСА (GET) ---
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "No ID" }, { status: 400 });

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const prediction = await replicate.predictions.get(id);
    
    return NextResponse.json(prediction);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 3. СОХРАНЕНИЕ И ОТПРАВКА ПИСЕМ (PUT) ---
// Вызывается фронтендом, когда статус === 'succeeded'
export async function PUT(req) {
  try {
    const body = await req.json();
    const { predictionId, userId, productId, personImage, garmentImage, modelParams } = body;

    if (!predictionId) return NextResponse.json({ error: "No ID" }, { status: 400 });

    // Получаем финальный результат из Replicate (для безопасности)
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status !== 'succeeded') {
        return NextResponse.json({ error: "Not succeeded yet" }, { status: 400 });
    }

    const resultUrl = prediction.output;
    await connectMongoDB();
    
    let currentUser = null;
    if (userId) {
        currentUser = await User.findOne({ firebaseUid: userId });
    }

    let productInfo = null;
    if (productId) {
        productInfo = await Product.findById(productId);
    }

    // Фоновые задачи (без await, чтобы не тормозить ответ фронту, или с await, если хотим гарантии)
    // Здесь лучше использовать await, так как это отдельный быстрый запрос
    
    // 1. Сохраняем в Гардероб
    if (currentUser) {
        await Wardrobe.create({
            userId: currentUser._id,
            productId: productId || null,
            originalImage: personImage,
            garmentImage: garmentImage,
            resultImage: resultUrl,
            modelParams: modelParams || {}
        });
    }

    // 2. Шлем письма
    const emailPromises = [];

    // Клиенту
    if (currentUser && currentUser.email) {
        const productLink = productId ? `https://parizod.tj/product/${productId}` : 'https://parizod.tj/catalog';
        emailPromises.push(sendClientResultEmail({
            email: currentUser.email,
            userName: currentUser.name,
            resultUrl: resultUrl,
            productLink: productLink,
            productName: productInfo ? productInfo.name : 'Товар'
        }));
    }

    // Админу
    emailPromises.push(sendAdminDebugEmail({
        userDetails: currentUser ? { name: currentUser.name, email: currentUser.email } : { name: 'Guest' },
        originalImg: personImage,
        garmentImg: garmentImage,
        resultImg: resultUrl,
        logs: { id: predictionId, ...modelParams }
    }));

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Save/Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}