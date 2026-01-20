import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Список категорий для AI, чтобы он выбирал только из того, что есть у нас в админке
const CATEGORIES_CONTEXT = `
  1. long_dress (Длинное платье) -> aiType: dresses
  2. short_dress (Короткое платье) -> aiType: dresses
  3. coat (Пальто / Тренч) -> aiType: dresses
  4. fur_coat_long (Шуба Длинная) -> aiType: dresses
  5. fur_coat_short (Шуба Короткая) -> aiType: upper_body
  6. puffer_long (Пуховик Длинный) -> aiType: dresses
  7. jacket (Пуховик / Куртка Короткие) -> aiType: upper_body
  8. blazer (Пиджак / Жакет) -> aiType: upper_body
  9. shirt (Блузка / Рубашка) -> aiType: upper_body
  10. jumpsuit (Костюм / Комбинезон) -> aiType: dresses
  11. skirt (Юбка) -> aiType: lower_body
  12. pants (Брюки / Джинсы) -> aiType: lower_body
`;

export async function POST(req) {
  try {
    const { imageBase64, currentData } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Нет изображения" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Формируем контекст из того, что пользователь уже написал
    let userHints = "";
    if (currentData.name) userHints += `- Название (учитывай стиль): ${currentData.name}\n`;
    if (currentData.description) userHints += `- Заметки/Особенности: ${currentData.description}\n`;
    if (currentData.material) userHints += `- Материал (строго используй этот): ${currentData.material}\n`;

    // Промпт
    const prompt = `
      Ты профессиональный fashion-копирайтер. 
      Проанализируй фото одежды и заполни карточку товара.

      ВХОДНЫЕ ДАННЫЕ ОТ ПОЛЬЗОВАТЕЛЯ (ПРИОРИТЕТ):
      ${userHints || "Нет дополнительных заметок."}

      ИНСТРУКЦИЯ:
      1. Если пользователь указал материал (например, "вельвет"), ОБЯЗАТЕЛЬНО используй это.
      2. Если в заметках есть детали (например, "съемные рукава"), обязательно включи их в описание.
      3. Название: Краткое, продающее, на русском.
      4. Описание: 2-3 красивых предложения с эмодзи.
      5. Категория: Выбери ОДНУ из списка ниже (value и aiType):
         ${CATEGORIES_CONTEXT}
      
      Верни ТОЛЬКО чистый JSON:
      {
        "name": "string",
        "description": "string",
        "category": "string (value из списка)",
        "aiCategory": "string (aiType из списка)",
        "material": "string",
        "details": "string"
      }
    `;

    const base64Data = imageBase64.split(",")[1];
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanText);

    return NextResponse.json(data);

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}