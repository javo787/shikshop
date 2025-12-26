import { client } from '@gradio/client';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Увеличиваем таймаут
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { personImage, garmentImage } = await req.json();

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: 'Необходимо фото человека и одежды' }, { status: 400 });
    }

    // ВАЖНО: Проверяем, что ссылка на одежду публичная (Cloudinary)
    // Нейросеть НЕ видит локальные ссылки (localhost или /api/images/...)
    if (!garmentImage.startsWith('http')) {
      return NextResponse.json({ 
        error: 'Для примерки выберите товар с фото из Cloudinary (не локальное).' 
      }, { status: 400 });
    }

    console.log("🚀 Запуск AI (yisol)...");
    
    // Используем yisol/IDM-VTON (оригинальный спейс часто стабильнее)
    const app = await client("yisol/IDM-VTON");

    const result = await app.predict("/tryon", [
      personImage, 
      garmentImage, 
      "High quality, realistic", 
      true, 
      true, 
      30, 
      42 
    ]);

    // Обработка разных форматов ответа Gradio
    let generatedImage = null;
    if (result.data && result.data[0]) {
        generatedImage = result.data[0].url || result.data[0];
    }

    if (!generatedImage) throw new Error("AI вернул пустой результат");

    return NextResponse.json({ image: generatedImage });
  } catch (error) {
    console.error('Ошибка AI-примерки:', error);
    return NextResponse.json({ 
        error: 'Сервер AI перегружен или недоступен. Попробуйте через минуту.' 
    }, { status: 500 });
  }
}