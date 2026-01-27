import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { topic, imageBase64 } = await req.json();

    if (!topic && !imageBase64) {
      return NextResponse.json({ error: "Напишите тему или загрузите фото!" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    // Используем модель, которая хороша в текстах
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const prompt = `
      Ты — главный редактор модного журнала и блога магазина одежды "Parizod".
      Твоя задача: Написать профессиональную, вовлекающую статью для блога, которая вызовет доверие к магазину.
      
      ВХОДНЫЕ ДАННЫЕ:
      Тема/Заметки: "${topic || "Опиши то, что на фото, и дай советы по стилю"}"

      ТРЕБОВАНИЯ:
      1. Стиль: Экспертный, но дружелюбный. Используй "мы", говоря от лица бренда.
      2. Доверие: Давай конкретные советы (ткани, уход, сочетания). Покупатель должен понять, что тут работают профи.
      3. Структура: Используй абзацы, эмодзи (немного), списки.
      4. SEO: Заголовок должен быть кликабельным.
      5. Язык: Русский.

      ВЕРНИ ТОЛЬКО ЧИСТЫЙ JSON (без markdown):
      {
        "title": "Привлекательный заголовок",
        "slug": "url-na-angliyskom-dlya-seo",
        "excerpt": "Короткое описание (1-2 предложения) для Google и превью, интригующее.",
        "content": "Полный текст статьи. Можно использовать переносы строк \\n. Не используй заголовки Markdown (#), просто пиши текст."
      }
    `;

    const parts = [prompt];

    // Если есть фото, добавляем его в анализ
    if (imageBase64) {
      const base64Data = imageBase64.split(",")[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    // Очистка от возможных markdown кавычек
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
        const data = JSON.parse(cleanText);
        return NextResponse.json(data);
    } catch (e) {
        console.error("JSON Parse Error:", text);
        return NextResponse.json({ error: "Ошибка формата ответа AI" }, { status: 500 });
    }

  } catch (error) {
    console.error("AI Blog Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}