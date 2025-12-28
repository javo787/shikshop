import Replicate from "replicate";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// 👇👇👇 НАЧАЛО ШПИОНСКОЙ ПРОВЕРКИ 👇👇👇
// Этот блок напишет в логах Vercel, видит ли он твой токен на самом деле.
const token = process.env.REPLICATE_API_TOKEN;
console.log("🔍 [DEBUG] Токен загружен?", token ? "ДА" : "НЕТ (NULL/UNDEFINED)");

if (token) {
    // Показываем первые 3 буквы, чтобы убедиться, что это правильный токен (должен быть "r8_")
    console.log("🔍 [DEBUG] Первые 3 символа:", token.substring(0, 3));
    console.log("🔍 [DEBUG] Длина токена:", token.length);
} else {
    console.error("❌ [CRITICAL] ТОКЕН ОТСУТСТВУЕТ! Vercel его не видит.");
}
// 👆👆👆 КОНЕЦ ПРОВЕРКИ 👆👆👆

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// 1. POST: Только ЗАПУСКАЕТ процесс (это быстро)
export async function POST(req) {
  try {
    const { personImage, garmentImage } = await req.json();

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Нет фото" }, { status: 400 });
    }

    console.log("🚀 [API] Создаем задачу...");

    // Создаем предсказание, но НЕ ждем результат (используем .create вместо .run)
    const prediction = await replicate.predictions.create({
      version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
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
      }
    });

    console.log("✅ [API] Задача создана, ID:", prediction.id);

    // Возвращаем ID задачи клиенту
    return NextResponse.json(prediction);

  } catch (error) {
    console.error("❌ Ошибка запуска:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. GET: Проверяет статус задачи по ID
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    const prediction = await replicate.predictions.get(id);

    // Если всё готово — возвращаем результат
    return NextResponse.json(prediction);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}