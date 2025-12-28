import Replicate from "replicate";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { personImage, garmentImage } = await req.json();

    // 🧨 ЯДЕРНЫЙ МЕТОД: Вставляем ключ прямо сюда
    // Вставь свой токен r8_... ВНУТРЬ кавычек ниже 👇
    const API_TOKEN = "r8_OnzGJ5V35eYkWbpF4FjYiULQgTDaHdz0c2bCm";

    console.log("🚀 [API] Используем вшитый ключ (Hardcode Check)...");

    const replicate = new Replicate({
      auth: API_TOKEN, // Берем переменную сверху
    });

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Нет фото" }, { status: 400 });
    }

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
    return NextResponse.json(prediction);

  } catch (error) {
    console.error("❌ Ошибка запуска:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // И здесь тоже вставляем ключ
    const API_TOKEN = "ВСТАВЬ_СЮДА_СВОЙ_ТОКЕН_КОТОРЫЙ_НАЧИНАЕТСЯ_НА_r8"; 

    const replicate = new Replicate({
      auth: API_TOKEN,
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