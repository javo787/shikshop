import { NextResponse } from "next/server";
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import TryOnLog from '@/models/TryOnLog';
import Product from '@/models/Product';
import { sendClientResultEmail, sendAdminDebugEmail } from '@/lib/email'; 
import Replicate from "replicate"; 

// 🔥 ИМПОРТИРУЕМ НОВУЮ ЕДИНУЮ ФУНКЦИЮ
import { generateTryOn, AI_MODELS } from '@/lib/ai-service';

// Если у вас есть этот файл - отлично. Если нет, закомментируйте импорт и использование ниже.
import { addBranding } from '@/lib/image-processing'; 

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

// --- 1. POST: Запуск генерации ---
export async function POST(req) {
  try {
    // Читаем параметры. modelKey теперь определяет выбор (google-vton, gemini-flash, idm-vton)
    const { personImage, garmentImage, userId, category = "upper_body", modelKey } = await req.json();
    
    // Если модель не пришла или кривая, берем Google VTON по умолчанию
    const selectedModel = (modelKey && AI_MODELS[modelKey]) ? modelKey : 'google-vton';

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
      if (currentUser.isBlocked) return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
      
      if (currentUser.tryOnBalance <= 0) {
        await TryOnLog.create({ userId: currentUser._id, ipAddress: ip, status: 'blocked', userAgent });
        return NextResponse.json({ error: 'LIMIT_REACHED_BUY', message: 'Лимит исчерпан.' }, { status: 403 });
      }
      
      // Списываем баланс
      currentUser.tryOnBalance -= 1;
      await currentUser.save();
      await TryOnLog.create({ userId: currentUser._id, ipAddress: ip, status: 'success', userAgent, model: selectedModel });
    } else {
      const usageCount = await TryOnLog.countDocuments({ ipAddress: ip, userId: null, status: 'success' });
      if (usageCount >= 1) return NextResponse.json({ error: 'LIMIT_REACHED_GUEST', message: 'Гостевой лимит.' }, { status: 403 });
      await TryOnLog.create({ userId: null, ipAddress: ip, status: 'success', userAgent, model: selectedModel });
    }

    console.log(`🚀 Start | User: ${userId || 'Guest'} | Model: ${selectedModel}`);

    // --- ЗАПУСК ЧЕРЕЗ ЕДИНЫЙ СЕРВИС ---
    // generateTryOn сама решит, куда стучаться (Google VTON, Gemini или Replicate)
    let result;
    try {
        result = await generateTryOn(selectedModel, { personImage, garmentImage, category });
    } catch (aiError) {
        console.error("❌ AI Gen Error:", aiError);
        // Возврат баланса при ошибке
        if (currentUser) {
            currentUser.tryOnBalance += 1;
            await currentUser.save();
        }
        return NextResponse.json({ error: aiError.message }, { status: 500 });
    }

    // --- ОБРАБОТКА РЕЗУЛЬТАТА ---
    
    // ВАРИАНТ А: СИНХРОННЫЙ ОТВЕТ (Google Vertex / Gemini)
    // ai-service возвращает объект { output: "base64...", status: "succeeded" }
    if (result.output && result.status === 'succeeded' && result.output.startsWith('data:image')) {
        
        let finalImage = result.output;
        
        // 🔥 НАЛОЖЕНИЕ ЛОГОТИПА (Если функция есть)
        try {
            if (typeof addBranding === 'function') {
                finalImage = await addBranding(finalImage);
            }
        } catch (e) {
            console.error("Branding error (Google):", e);
        }

        return NextResponse.json({ 
            id: `google-${Date.now()}`, // Фейковый ID для совместимости
            status: "succeeded", 
            output: finalImage, 
            remaining: currentUser ? currentUser.tryOnBalance : 0
        });
    }

    // ВАРИАНТ Б: АСИНХРОННЫЙ ОТВЕТ (Replicate)
    // ai-service возвращает объект prediction от Replicate { id: "...", status: "starting" }
    else if (result.id) {
        return NextResponse.json({ 
            id: result.id, 
            status: result.status || "starting", 
            remaining: currentUser ? currentUser.tryOnBalance : 0
        });
    }

    // ВАРИАНТ В: Непонятный ответ
    else {
        throw new Error("Некорректный ответ от AI сервиса");
    }

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. GET: Проверка статуса (Только для Replicate) ---
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || id === 'undefined' || id === 'null') {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Если это Google ID (который мы сгенерировали сами), значит всё уже готово
    if (id.startsWith('google-')) {
        return NextResponse.json({ status: "succeeded" });
    }

    // Если это Replicate ID — проверяем статус
    try {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const prediction = await replicate.predictions.get(id);
        
        if (prediction.status === 'failed') {
            return NextResponse.json({ status: 'failed', error: prediction.error });
        }

        return NextResponse.json(prediction);
    } catch (e) {
        console.error("Replicate GET error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// --- 3. PUT: Финализация (Сохранение + Письма) ---
export async function PUT(req) {
  try {
    const body = await req.json();
    const { predictionId, userId, productId, personImage, garmentImage, resultImageOverride, modelKey } = body;

    let finalImage = resultImageOverride;

    // ЛОГИКА ДЛЯ REPLICATE: Если картинки нет в body, тянем её по ID
    if (!finalImage && predictionId && !predictionId.startsWith('google-') && predictionId !== 'undefined') {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const prediction = await replicate.predictions.get(predictionId);
        
        if (prediction.status === 'succeeded') {
             const rawUrl = prediction.output;
             
             // 🔥 НАЛОЖЕНИЕ ЛОГОТИПА ДЛЯ REPLICATE
             try {
                if (typeof addBranding === 'function') {
                    finalImage = await addBranding(rawUrl);
                } else {
                    finalImage = rawUrl;
                }
             } catch (e) {
                console.error("Branding error (Replicate):", e);
                finalImage = rawUrl;
             }
        }
    }

    if (!finalImage) return NextResponse.json({ error: "Результат не найден" }, { status: 400 });

    await connectMongoDB();
    
    let currentUser = null;
    if (userId) currentUser = await User.findOne({ firebaseUid: userId });

    let productInfo = null;
    if (productId) productInfo = await Product.findById(productId);

    // 1. Сохраняем в Гардероб (Если нужно)
    // ... (код сохранения можно добавить здесь, если вы используете Wardrobe модель) ...

    // 2. Отправка писем
    const emailPromises = [];

    if (currentUser && currentUser.email) {
        // Убедитесь, что домен правильный (ваш Vercel app или кастомный домен)
        const productLink = productId ? `https://parizod.tj/product/${productId}` : 'https://parizod.tj/catalog';
        emailPromises.push(sendClientResultEmail({
            email: currentUser.email,
            userName: currentUser.name,
            resultUrl: finalImage,
            productLink: productLink,
            productName: productInfo ? productInfo.name : 'Товар'
        }));
    }

    emailPromises.push(sendAdminDebugEmail({
        userDetails: currentUser ? { name: currentUser.name } : { name: 'Guest' },
        logs: { id: predictionId, model: modelKey || 'auto' }
    }));

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ success: true, brandedImage: finalImage });

  } catch (error) {
    console.error("❌ Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } 
}