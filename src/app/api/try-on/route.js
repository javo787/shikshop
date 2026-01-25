import { NextResponse } from "next/server";
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import TryOnLog from '@/models/TryOnLog';
// import Wardrobe from '@/models/Wardrobe'; // <-- Пока отключено
import Product from '@/models/Product';
import { sendClientResultEmail, sendAdminDebugEmail } from '@/lib/email'; 
import { runReplicate, runGoogle, AI_MODELS } from '@/lib/ai-service';
import { addBranding } from '@/lib/image-processing';
import Replicate from "replicate"; 

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Увеличиваем тайм-аут

// --- 1. POST: Запуск генерации ---
export async function POST(req) {
  try {
    // modelKey - это ключ из AI_MODELS (например 'replicate-idm-vton')
    const { personImage, garmentImage, userId, category = "upper_body", modelKey = 'google-vertex' } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Нет фото" }, { status: 400 });
    }

    await connectMongoDB();
    let currentUser = null;

    // --- ПРОВЕРКА ЛИМИТОВ ---
    if (userId) {
      currentUser = await User.findOne({ firebaseUid: userId });
      if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      
      if (currentUser.tryOnBalance <= 0) {
        await TryOnLog.create({ userId: currentUser._id, ipAddress: ip, status: 'blocked', userAgent });
        return NextResponse.json({ error: 'LIMIT_REACHED_BUY', message: 'Лимит исчерпан.' }, { status: 403 });
      }
      
      currentUser.tryOnBalance -= 1;
      await currentUser.save();
      await TryOnLog.create({ userId: currentUser._id, ipAddress: ip, status: 'success', userAgent, model: modelKey });
    } else {
      const usageCount = await TryOnLog.countDocuments({ ipAddress: ip, userId: null, status: 'success' });
      if (usageCount >= 1) return NextResponse.json({ error: 'LIMIT_REACHED_GUEST', message: 'Гостевой лимит.' }, { status: 403 });
      await TryOnLog.create({ userId: null, ipAddress: ip, status: 'success', userAgent, model: modelKey });
    }

    console.log(`🚀 Start | User: ${userId || 'Guest'} | Model: ${modelKey}`);

    // --- ЗАПУСК НЕЙРОСЕТЕЙ ---
    
    // 1. Google Vertex (Синхронный)
    if (modelKey === 'google-vertex') {
        try {
            const rawResult = await runGoogle(personImage, garmentImage);
            
            // 🔥 Накладываем логотип ПРЯМО ЗДЕСЬ
            const brandedResult = await addBranding(rawResult);

            return NextResponse.json({ 
                id: `google-${Date.now()}`,
                status: "succeeded", 
                output: brandedResult, // Отдаем уже с логотипом
                remaining: currentUser ? currentUser.tryOnBalance : 0
            });
        } catch (err) {
            // Возврат баланса при ошибке
            if (currentUser) {
                currentUser.tryOnBalance += 1;
                await currentUser.save();
            }
            throw err;
        }
    } 
    
    // 2. Replicate (Асинхронный - любая модель из конфига)
    else if (AI_MODELS[modelKey]?.provider === 'replicate') {
        const prediction = await runReplicate(modelKey, {
            human_img: personImage,
            garm_img: garmentImage,
            category: category,
            garment_des: "high quality, realistic texture"
        });

        return NextResponse.json({ 
            id: prediction.id,
            status: "starting", // Фронтенд должен делать polling
            remaining: currentUser ? currentUser.tryOnBalance : 0
        });
    }

    else {
        return NextResponse.json({ error: "Неизвестная модель" }, { status: 400 });
    }

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. GET: Проверка статуса (только для Replicate) ---
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id && id.startsWith('google-')) return NextResponse.json({ status: "succeeded" });

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const prediction = await replicate.predictions.get(id);
    return NextResponse.json(prediction);
}

// --- 3. PUT: Финализация (Сохранение + Письма) ---
export async function PUT(req) {
  try {
    const body = await req.json();
    let { predictionId, userId, productId, personImage, garmentImage, resultImageOverride } = body;

    let finalImage = resultImageOverride;

    // Если это Replicate, результат нужно забрать из API
    if (!finalImage && predictionId && !predictionId.startsWith('google-')) {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const prediction = await replicate.predictions.get(predictionId);
        
        if (prediction.status === 'succeeded') {
             // Replicate отдает URL, нам нужно его скачать и наложить лого
             const rawUrl = prediction.output;
             // 🔥 Накладываем логотип (скачает URL, добавит лого, вернет Base64)
             finalImage = await addBranding(rawUrl);
        }
    }

    if (!finalImage) return NextResponse.json({ error: "Результат не найден" }, { status: 400 });

    await connectMongoDB();
    
    let currentUser = null;
    if (userId) currentUser = await User.findOne({ firebaseUid: userId });

    let productInfo = null;
    if (productId) productInfo = await Product.findById(productId);
    
    // --- СОХРАНЕНИЕ В ГАРДЕРОБ ---
    // Проверяем, существует ли модель Wardrobe (ты сказал, пока не реализовал)
    /*
    try {
        if (currentUser) {
             // Здесь сохраняем. В будущем лучше сохранять URL (S3), а не Base64
             await Wardrobe.create({
                userId: currentUser._id,
                resultImage: finalImage, // Уже с логотипом
                originalImage: personImage,
                // ...
             });
        }
    } catch (dbError) {
        console.warn("⚠️ Ошибка сохранения в Гардероб (возможно, схема не готова):", dbError.message);
        // Не прерываем выполнение, идем к письмам
    }
    */

    // --- ОТПРАВКА ПИСЕМ ---
    // Отправляем finalImage (который уже Base64 c логотипом)
    const emailPromises = [];

    if (currentUser && currentUser.email) {
        const productLink = productId ? `https://shikshop.vecel.app/product/${productId}` : 'https://shikshop.vecel.app/catalog';
        emailPromises.push(sendClientResultEmail({
            email: currentUser.email,
            userName: currentUser.name,
            resultUrl: finalImage, // Важно: некоторые почтовики не любят длинные Base64
            productLink: productLink,
            productName: productInfo ? productInfo.name : 'Товар'
        }));
    }

    emailPromises.push(sendAdminDebugEmail({
        userDetails: currentUser ? { name: currentUser.name } : { name: 'Guest' },
        logs: { id: predictionId, model: 'auto' }
    }));

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ success: true, brandedImage: finalImage });

  } catch (error) {
    console.error("❌ Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } 
}