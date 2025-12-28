import Replicate from "replicate";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  console.log("POST /api/try-on called"); // Добавлено для подтверждения вызова
  console.log("Auth header will be: Bearer " + (process.env.REPLICATE_API_TOKEN ? process.env.REPLICATE_API_TOKEN : "MISSING"));
  console.log("REPLICATE_API_TOKEN:", process.env.REPLICATE_API_TOKEN || "undefined"); // Добавлено для проверки (с или undefined)
  try {
    const { personImage, garmentImage } = await req.json();

    // 👇 БЕРЕМ КЛЮЧ ИЗ НАСТРОЕК VERCEL (БЕЗОПАСНО)
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
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

    return NextResponse.json(prediction);

  } catch (error) {
    console.error("❌ Ошибка:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  console.log("GET /api/try-on called"); // Добавлено для подтверждения вызова
  console.log("REPLICATE_API_TOKEN:", process.env.REPLICATE_API_TOKEN || "undefined"); // Добавлено для проверки
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // 👇 И ЗДЕСЬ ТОЖЕ БЕЗОПАСНО
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
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