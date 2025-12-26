import { client } from '@gradio/client';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { personImage, garmentImage } = await req.json();

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: 'Необходимо фото человека и одежды' }, { status: 400 });
    }

    // Альтернативный Space (если yisol не работает)
    const app = await client("aravindr226/IDM-VTON");

    const result = await app.predict("/tryon", [
      personImage,
      garmentImage,
      "High quality, realistic",
      true,
      true,
      30,
      42
    ]);

    const generatedImage = result.data[0];

    return NextResponse.json({ image: generatedImage });
  } catch (error) {
    console.error('Ошибка AI-примерки:', error);
    return NextResponse.json({ error: 'Сервер AI временно недоступен, попробуйте позже' }, { status: 500 });
  }
}