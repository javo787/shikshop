import { NextResponse } from "next/server";
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import TryOnLog from '@/models/TryOnLog';
import Wardrobe from '@/models/Wardrobe'; 
import Product from '@/models/Product';
import { sendClientResultEmail, sendAdminDebugEmail } from '@/lib/email'; 
import { GoogleAuth } from 'google-auth-library';

export const dynamic = 'force-dynamic';
// Увеличиваем время ожидания для Vercel (Google может думать 15-30 сек)
export const maxDuration = 60; 

// --- КОНФИГУРАЦИЯ ---
const REGION = 'us-central1'; // Основной регион для Vertex AI
const API_ENDPOINT = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${REGION}/publishers/google/models/virtual-try-on-001:predict`;

/**
 * Функция вызова Google Vertex AI
 */
async function callGoogleTryOn(personImageBase64, garmentImageBase64) {
  // Настройка авторизации
  const authOptions = {
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  };

  // ЕСЛИ мы на Vercel (читаем ключ из переменной)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      authOptions.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.error("Ошибка парсинга GOOGLE_SERVICE_ACCOUNT_KEY:", e);
      throw new Error("Invalid Server Credentials");
    }
  }
  // ЕСЛИ мы локально (библиотека сама найдет файл по пути GOOGLE_APPLICATION_CREDENTIALS)

  const auth = new GoogleAuth(authOptions);
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  // Очистка Base64 (удаляем префиксы "data:image...", если они есть)
  const cleanPerson = personImageBase64.replace(/^data:image\/\w+;base64,/, "");
  const cleanGarment = garmentImageBase64.replace(/^data:image\/\w+;base64,/, "");

  // Формируем запрос строго по документации Google
  const requestBody = {
    instances: [
      {
        person_image: { bytes: cleanPerson },
        product_image: { bytes: cleanGarment }
      }
    ],
    // Параметры генерации
    parameters: {
      seed: Math.floor(Math.random() * 1000000)
    }
  };

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.predictions || !data.predictions[0] || !data.predictions[0].bytes) {
    throw new Error("Google API did not return an image.");
  }

  // Google возвращает чистые байты, добавляем заголовок для браузера
  return `data:image/png;base64,${data.predictions[0].bytes}`;
}

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

    // --- БЛОК ПРОВЕРКИ ЛИМИТОВ ---
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
      await TryOnLog.create({ userId: currentUser._id, ipAddress: ip, status: 'success', userAgent });

    } else {
      const usageCount = await TryOnLog.countDocuments({ ipAddress: ip, userId: null, status: 'success' });
      if (usageCount >= 1) { 
        return NextResponse.json({ error: 'LIMIT_REACHED_GUEST', message: 'Гостевой лимит исчерпан.' }, { status: 403 });
      }
      await TryOnLog.create({ userId: null, ipAddress: ip, status: 'success', userAgent });
    }

    console.log(`🚀 Start Google Try-On | User: ${userId || 'Guest'}`);

    // --- ЗАПУСК GOOGLE VERTEX AI ---
    let resultBase64 = "";
    try {
        // Это занимает 10-20 секунд, ждем ответ сразу
        resultBase64 = await callGoogleTryOn(personImage, garmentImage);
    } catch (googleError) {
        console.error("❌ Google AI Failed:", googleError);
        
        // Возвращаем баланс, если ошибка на стороне Google
        if (currentUser) {
            currentUser.tryOnBalance += 1;
            await currentUser.save();
        }
        return NextResponse.json({ error: "AI Error: " + googleError.message }, { status: 500 });
    }

    // Генерируем фейковый ID для совместимости с фронтендом, если он его ждет
    const fakeId = `google-${Date.now()}`;

    // Возвращаем результат сразу!
    // Обратите внимание: output содержит готовую картинку, статус immediately succeeded
    return NextResponse.json({ 
        id: fakeId,
        status: "succeeded", 
        output: resultBase64, 
        remaining: currentUser ? currentUser.tryOnBalance : 0,
        modelParams: { model: "google-virtual-try-on-001" } 
    });

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. ПРОВЕРКА СТАТУСА (GET) ---
// Google отвечает сразу в POST, поэтому GET нужен только для совместимости,
// если фронтенд по привычке делает опрос.
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    // Всегда говорим, что всё готово. 
    // Фронтенд должен был получить картинку еще в ответе на POST.
    return NextResponse.json({ 
        id: id || 'unknown', 
        status: "succeeded",
        output: null 
    });
}

// --- 3. СОХРАНЕНИЕ И ОТПРАВКА ПИСЕМ (PUT) ---
export async function PUT(req) {
  try {
    const body = await req.json();
    // ВАЖНО: Фронтенд теперь должен передавать resultImageOverride (картинку из ответа POST),
    // так как мы не храним её в "облаке Replicate", она пришла сразу.
    const { predictionId, userId, productId, personImage, garmentImage, modelParams, resultImageOverride } = body;

    // Берем картинку, которую прислал фронтенд (base64)
    const finalResultUrl = resultImageOverride || null;

    if (!finalResultUrl) {
        // Если фронтенд старый и не прислал картинку, мы не можем её восстановить, так как Google не хранит историю ссылок
        return NextResponse.json({ error: "No result image provided via resultImageOverride" }, { status: 400 });
    }

    await connectMongoDB();
    
    let currentUser = null;
    if (userId) {
        currentUser = await User.findOne({ firebaseUid: userId });
    }

    let productInfo = null;
    if (productId) {
        productInfo = await Product.findById(productId);
    }
    
    // 1. Сохраняем в Гардероб
    if (currentUser) {
        // Внимание: Base64 длинный. Если MongoDB ругается на размер >16MB,
        // лучше загружать finalResultUrl на S3/Cloudinary и сохранять ссылку.
        // Для MVP оставляем как есть.
        await Wardrobe.create({
            userId: currentUser._id,
            productId: productId || null,
            originalImage: personImage,
            garmentImage: garmentImage,
            resultImage: finalResultUrl, 
            modelParams: modelParams || { source: 'google-vertex' }
        });
    }

    // 2. Отправка писем
    const emailPromises = [];

    if (currentUser && currentUser.email) {
        const productLink = productId ? `https://parizod.tj/product/${productId}` : 'https://parizod.tj/catalog';
        emailPromises.push(sendClientResultEmail({
            email: currentUser.email,
            userName: currentUser.name,
            resultUrl: finalResultUrl, // Осторожно, Base64 в письме может не отобразиться в некоторых клиентах!
            productLink: productLink,
            productName: productInfo ? productInfo.name : 'Товар'
        }));
    }

    emailPromises.push(sendAdminDebugEmail({
        userDetails: currentUser ? { name: currentUser.name, email: currentUser.email } : { name: 'Guest' },
        originalImg: personImage,
        garmentImg: garmentImage,
        resultImg: "Base64 Image (hidden)", // Не шлем полный Base64 в админку, чтобы не спамить логи
        logs: { id: predictionId, ...modelParams }
    }));

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Save/Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } 
}