import Replicate from "replicate";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// 1. ЗАПУСК ЗАДАЧИ (POST)
export async function POST(req) {
  try {
    const { personImage, garmentImage } = await req.json();

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Нет фото" }, { status: 400 });
    }

    // Создаем задачу, но не ждем результат (.predictions.create)
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

    // Возвращаем клиенту ID задачи
    return NextResponse.json(prediction);

  } catch (error) {
    console.error("❌ Ошибка запуска:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. ПРОВЕРКА СТАТУСА (GET)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    const prediction = await replicate.predictions.get(id);

    return NextResponse.json(prediction);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}