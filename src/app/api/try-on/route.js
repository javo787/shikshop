import Replicate from "replicate";
import { NextResponse } from "next/server";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req) {
  try {
    const { personImage, garmentImage } = await req.json();

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: "Нет фото" }, { status: 400 });
    }

    console.log("🚀 START: Отправляем запрос в Replicate...");

    // Запускаем модель
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

    console.log("📥 RAW Replicate Output:", output); // Посмотрим в консоли, что пришло

    // 👇 ГЛАВНОЕ ИСПРАВЛЕНИЕ: Превращаем ответ в чистую ссылку
    let finalUrl = output;

    // 1. Если это массив (список ссылок), берем первую
    if (Array.isArray(output)) {
      finalUrl = output[0];
    } 
    // 2. Превращаем в строку (на всякий случай)
    finalUrl = String(finalUrl);

    console.log("✅ SENDING URL:", finalUrl);

    return NextResponse.json({ resultImage: finalUrl });

  } catch (error) {
    console.error("❌ Ошибка Replicate:", error);
    
    if (error.message?.includes("billing") || error.message?.includes("payment")) {
       return NextResponse.json({ error: "Пополните баланс Replicate." }, { status: 402 });
    }

    return NextResponse.json(
      { error: "Не удалось выполнить примерку." },
      { status: 500 }
    );
  }
}