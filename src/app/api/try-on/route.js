import Replicate from "replicate";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  console.log("🚀 POST /api/try-on: Запуск метода POST");
  console.log("🔑 Auth header: Bearer " + (process.env.REPLICATE_API_TOKEN ? process.env.REPLICATE_API_TOKEN : "MISSING"));
  console.log("🔑 REPLICATE_API_TOKEN:", process.env.REPLICATE_API_TOKEN || "undefined");

  try {
    console.log("📥 Чтение данных из запроса...");
    const { personImage, garmentImage } = await req.json();
    console.log("📥 Данные получены: personImage=", personImage ? "есть" : "нет", ", garmentImage=", garmentImage ? "есть" : "нет");

    console.log("🔌 Создание клиента Replicate...");
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    console.log("🔌 Клиент Replicate создан успешно");

    if (!personImage || !garmentImage) {
      console.log("❌ Ошибка: Нет фото (personImage или garmentImage отсутствует)");
      return NextResponse.json({ error: "Нет фото" }, { status: 400 });
    }

    console.log("🛠 Создание предсказания...");
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
    console.log("✅ Предсказание создано успешно: ID=", prediction.id);

    return NextResponse.json(prediction);

  } catch (error) {
    console.error("❌ Ошибка в POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  console.log("🚀 GET /api/try-on: Запуск метода GET");
  console.log("🔑 REPLICATE_API_TOKEN:", process.env.REPLICATE_API_TOKEN || "undefined");

  try {
    console.log("📥 Чтение параметров из URL...");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    console.log("📥 ID из запроса:", id || "не указан");

    console.log("🔌 Создание клиента Replicate...");
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    console.log("🔌 Клиент Replicate создан успешно");

    if (!id) {
      console.log("❌ Ошибка: No ID provided");
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    console.log("🛠 Получение предсказания по ID...");
    const prediction = await replicate.predictions.get(id);
    console.log("✅ Предсказание получено успешно: статус=", prediction.status);

    return NextResponse.json(prediction);

  } catch (error) {
    console.error("❌ Ошибка в GET:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}