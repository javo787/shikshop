import Replicate from "replicate";
import { NextResponse } from "next/server";

// ⚙️ НАСТРОЙКИ СЕРВЕРА VERCEL (Важно!)
// Увеличиваем лимит времени выполнения до 60 секунд (максимум для Hobby тарифа)
export const maxDuration = 60; 
// Отключаем кэширование, чтобы каждый запрос был уникальным
export const dynamic = 'force-dynamic';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req) {
  try {
    // 1. Проверка входящих данных
    const body = await req.json();
    const { personImage, garmentImage } = body;

    if (!personImage || !garmentImage) {
      console.warn("⚠️ [API] Ошибка: Отсутствуют изображения");
      return NextResponse.json(
        { error: "Необходимо загрузить оба фото (человек и одежда)" }, 
        { status: 400 }
      );
    }

    console.log("🚀 [API] Старт генерации в Replicate...");

    // 2. Запуск нейросети
    // Используем модель IDM-VTON
    const output = await replicate.run(
      "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
      {
        input: {
          crop: false,
          seed: 42,
          steps: 30,
          category: "upper_body",
          force_dc: false,
          garm_img: garmentImage,
          human_img: personImage,
          mask_only: false,
          garment_des: "clothing",
        },
      }
    );

    console.log("📥 [API] Ответ от Replicate получен:", output);

    // 3. Обработка ответа (Приводим к строке)
    let finalUrl = output;

    // Если вернулся массив ссылок, берем первую
    if (Array.isArray(output)) {
      finalUrl = output[0];
    }
    
    // Гарантируем, что это строка
    finalUrl = String(finalUrl);

    if (!finalUrl || !finalUrl.startsWith('http')) {
        throw new Error("Replicate не вернул корректную ссылку на изображение");
    }

    console.log("✅ [API] Успех. Ссылка отправлена клиенту:", finalUrl);

    return NextResponse.json({ resultImage: finalUrl });

  } catch (error) {
    console.error("❌ [API CRITICAL ERROR]:", error);

    // Специальная обработка ошибок оплаты
    if (error.message?.includes("billing") || error.message?.includes("payment")) {
      return NextResponse.json(
        { error: "На сервере AI закончились средства. Пожалуйста, пополните баланс." }, 
        { status: 402 }
      );
    }

    // Обработка тайм-аута (если вдруг 60 сек не хватило)
    if (error.name === 'TimeoutError' || error.message?.includes('timed out')) {
        return NextResponse.json(
            { error: "Сервер не успел ответить. Попробуйте еще раз через минуту." },
            { status: 504 }
        );
    }

    return NextResponse.json(
      { error: "Не удалось выполнить примерку. Попробуйте другое фото." },
      { status: 500 }
    );
  }
}