import { NextResponse } from "next/server";
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import TryOnLog from '@/models/TryOnLog';
import Product from '@/models/Product';
import { sendClientResultEmail, sendAdminDebugEmail } from '@/lib/email'; 
import Replicate from "replicate"; 

// 🔥 ИМПОРТИРУЕМ ЕДИНУЮ ФУНКЦИЮ ГЕНЕРАЦИИ
import { generateTryOn, AI_MODELS } from '@/lib/ai-service';

// Импорт функции наложения логотипа
import { addBranding } from '@/lib/image-processing'; 

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

// =======================================================
// 1. POST: ЗАПУСК ГЕНЕРАЦИИ
// =======================================================
export async function POST(req) {
  const startTime = Date.now();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  console.log(`\n🔵 [API-POST] New Request from IP: ${ip}`);

  try {
    const body = await req.json();
    const { personImage, garmentImage, userId, category = "upper_body", modelKey } = body;

    console.log(`📦 [API-POST] Input Data: User=${userId || 'Guest'}, Category=${category}, ModelRequested=${modelKey}`);

    // 🚨 ВРЕМЕННОЕ РЕШЕНИЕ ПРОБЛЕМЫ GOOGLE (ОШИБКА 429)
    let selectedModel = 'idm-vton'; // <--- ПО УМОЛЧАНИЮ REPLICATE

    // Логика выбора модели
    if (modelKey && AI_MODELS[modelKey]) {
        // Если вы захотите вернуть Google, условие сработает здесь
        selectedModel = modelKey;
    }
    console.log(`🤖 [API-POST] Selected Model Logic: Requested "${modelKey}" -> Used "${selectedModel}"`);

    // 1. Проверка входных данных
    if (!personImage || !garmentImage) {
      console.warn(`⚠️ [API-POST] Missing images`);
      return NextResponse.json({ error: "Нет фото человека или одежды" }, { status: 400 });
    }

    await connectMongoDB();
    let currentUser = null;

    // 2. Проверка Лимитов и Баланса
    if (userId) {
      currentUser = await User.findOne({ firebaseUid: userId });
      if (!currentUser) {
          console.warn(`⚠️ [API-POST] User not found in DB: ${userId}`);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (currentUser.isBlocked) {
          console.warn(`⛔ [API-POST] User Blocked: ${currentUser.email}`);
          return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
      }
      
      console.log(`💳 [API-POST] User Balance: ${currentUser.tryOnBalance}`);

      if (currentUser.tryOnBalance <= 0) {
        await TryOnLog.create({ userId: currentUser._id, ipAddress: ip, status: 'blocked', userAgent });
        console.warn(`⛔ [API-POST] Balance exhausted`);
        return NextResponse.json({ error: 'LIMIT_REACHED_BUY', message: 'Лимит исчерпан. Пополните баланс.' }, { status: 403 });
      }
      
      // Списываем 1 примерку
      currentUser.tryOnBalance -= 1;
      await currentUser.save();
      await TryOnLog.create({ userId: currentUser._id, ipAddress: ip, status: 'success', userAgent, model: selectedModel });
      console.log(`💰 [API-POST] Balance deducted. New balance: ${currentUser.tryOnBalance}`);

    } else {
      // Для гостей
      const usageCount = await TryOnLog.countDocuments({ ipAddress: ip, userId: null, status: 'success' });
      console.log(`👀 [API-POST] Guest Usage Count: ${usageCount}`);
      
      if (usageCount >= 1) {
          console.warn(`⛔ [API-POST] Guest Limit Reached`);
          return NextResponse.json({ error: 'LIMIT_REACHED_GUEST', message: 'Гостевой лимит исчерпан.' }, { status: 403 });
      }
      await TryOnLog.create({ userId: null, ipAddress: ip, status: 'success', userAgent, model: selectedModel });
    }

    console.log(`🚀 [API-POST] Launching AI Service (${selectedModel})...`);

    // 3. Запуск Генерации (через ai-service.js)
    let result;
    try {
        console.time("⏱️ AI_Service_Call");
        result = await generateTryOn(selectedModel, { personImage, garmentImage, category });
        console.timeEnd("⏱️ AI_Service_Call");
        console.log(`✅ [API-POST] AI Service responded. Type: ${result.output ? 'SYNC (Image)' : 'ASYNC (ID)'}`);
    } catch (aiError) {
        console.error("❌ [API-POST] AI Generation Failed:", aiError);
        // Возврат средств при ошибке нейросети
        if (currentUser) {
            currentUser.tryOnBalance += 1;
            await currentUser.save();
            console.log(`↩️ [API-POST] Balance refunded due to error.`);
        }
        return NextResponse.json({ error: aiError.message || "Ошибка генерации" }, { status: 500 });
    }

    // 4. Обработка ответа
    
    // ВАРИАНТ А: Синхронный ответ (Google VTON / Gemini)
    if (result.output && result.status === 'succeeded' && result.output.startsWith('data:image')) {
        let finalImage = result.output;
        
        // Накладываем логотип
        try {
            if (typeof addBranding === 'function') {
                console.log(`🎨 [API-POST] Applying branding to Sync result...`);
                finalImage = await addBranding(finalImage);
            }
        } catch (e) {
            console.error("⚠️ Branding error (Google/Gemini):", e);
        }

        const duration = Date.now() - startTime;
        console.log(`🏁 [API-POST] Finished Sync Job in ${duration}ms`);

        return NextResponse.json({ 
            id: `google-${Date.now()}`,
            status: "succeeded", 
            output: finalImage, 
            remaining: currentUser ? currentUser.tryOnBalance : 0
        });
    }

    // ВАРИАНТ Б: Асинхронный ответ (Replicate)
    else if (result.id) {
        const duration = Date.now() - startTime;
        console.log(`🏁 [API-POST] Started Async Job ID: ${result.id} in ${duration}ms`);

        return NextResponse.json({ 
            id: result.id, 
            status: result.status || "starting", 
            remaining: currentUser ? currentUser.tryOnBalance : 0
        });
    }

    else {
        // Непонятный ответ
        console.error("❌ [API-POST] Unknown response format:", result);
        if (currentUser) {
            currentUser.tryOnBalance += 1;
            await currentUser.save();
        }
        throw new Error("Некорректный ответ от AI сервиса");
    }

  } catch (error) {
    console.error("❌ [API-POST] Global Catch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =======================================================
// 2. GET: ПРОВЕРКА СТАТУСА (Polling)
// =======================================================
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    console.log(`\n🔄 [API-GET] Status check for ID: ${id}`);

    if (!id || id === 'undefined' || id === 'null') {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Google ID
    if (id.startsWith('google-')) {
        console.log(`✅ [API-GET] Google ID detected (Instant Success)`);
        return NextResponse.json({ status: "succeeded" });
    }

    // Replicate ID
    try {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const prediction = await replicate.predictions.get(id);
        
        console.log(`📡 [API-GET] Replicate Status: ${prediction.status}`);

        if (prediction.status === 'failed') {
            console.error(`❌ [API-GET] Prediction Failed:`, prediction.error);
            return NextResponse.json({ status: 'failed', error: prediction.error });
        }

        return NextResponse.json(prediction);
    } catch (e) {
        console.error("❌ [API-GET] Replicate Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// =======================================================
// 3. PUT: ФИНАЛИЗАЦИЯ (Брендинг + Письма)
// =======================================================
export async function PUT(req) {
  console.log(`\n💾 [API-PUT] Start Finalization`);
  
  try {
    const body = await req.json();
    const { predictionId, userId, productId, personImage, garmentImage, resultImageOverride, modelKey } = body;

    console.log(`📦 [API-PUT] Params: ID=${predictionId}, User=${userId || 'Guest'}, HasOverride=${!!resultImageOverride}`);

    let finalImage = resultImageOverride;

    // Если картинки нет в запросе, но есть ID от Replicate -> вытягиваем её
    if (!finalImage && predictionId && !predictionId.startsWith('google-') && predictionId !== 'undefined') {
        console.log(`🔄 [API-PUT] Fetching final image from Replicate for ID: ${predictionId}`);
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const prediction = await replicate.predictions.get(predictionId);
        
        if (prediction.status === 'succeeded') {
             const rawUrl = prediction.output;
             console.log(`✅ [API-PUT] Image fetched: ${rawUrl}`);
             
             // Накладываем логотип
             try {
                if (typeof addBranding === 'function') {
                    console.log(`🎨 [API-PUT] Applying branding...`);
                    finalImage = await addBranding(rawUrl);
                } else {
                    finalImage = rawUrl;
                }
             } catch (e) {
                console.error("⚠️ Branding error (Replicate):", e);
                finalImage = rawUrl;
             }
        } else {
            console.warn(`⚠️ [API-PUT] Replicate status is not succeeded: ${prediction.status}`);
        }
    }

    if (!finalImage) {
        console.error(`❌ [API-PUT] No final image found.`);
        return NextResponse.json({ error: "Результат не найден или генерация не завершена" }, { status: 400 });
    }

    await connectMongoDB();
    
    let currentUser = null;
    let productInfo = null;

    if (userId) currentUser = await User.findOne({ firebaseUid: userId });
    if (productId) productInfo = await Product.findById(productId);

    console.log(`📧 [API-PUT] Preparing emails. UserEmail=${currentUser?.email || 'None'}`);

    // Отправка писем
    const emailPromises = [];

    if (currentUser && currentUser.email) {
        const productLink = productId ? `https://parizod.tj/product/${productId}` : 'https://parizod.tj/catalog';
        emailPromises.push(sendClientResultEmail({
            email: currentUser.email,
            userName: currentUser.name,
            resultUrl: finalImage,
            productLink: productLink,
            productName: productInfo ? productInfo.name : 'Товар'
        }));
    }

    // Лог админу
    emailPromises.push(sendAdminDebugEmail({
        userDetails: currentUser ? { name: currentUser.name } : { name: 'Guest' },
        logs: { id: predictionId, model: modelKey || 'auto' }
    }));

    await Promise.allSettled(emailPromises);
    console.log(`✅ [API-PUT] Emails processed. Final Response Sent.`);

    return NextResponse.json({ success: true, brandedImage: finalImage });

  } catch (error) {
    console.error("❌ [API-PUT] Finalization Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } 
}