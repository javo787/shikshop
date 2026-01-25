// lib/image-processing.js
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export async function addBranding(imageBase64OrUrl) {
  try {
    // 1. Получаем буфер исходного изображения
    let inputBuffer;
    if (imageBase64OrUrl.startsWith('data:image')) {
      // Если это base64 (от Google)
      const base64Data = imageBase64OrUrl.replace(/^data:image\/\w+;base64,/, "");
      inputBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Если это URL (от Replicate)
      const response = await fetch(imageBase64OrUrl);
      const arrayBuffer = await response.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    }

    // 2. Загружаем логотип
    // Убедись, что лого лежит в public/images/logo.png
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    
    // Проверяем, есть ли лого, чтобы не уронить сервер
    try {
        await fs.access(logoPath);
    } catch {
        console.warn("⚠️ Логотип не найден по пути:", logoPath);
        return imageBase64OrUrl; // Возвращаем оригинал, если лого нет
    }

    // 3. Получаем метаданные изображения, чтобы рассчитать размер лого
    const imageMetadata = await sharp(inputBuffer).metadata();
    const width = imageMetadata.width;
    
    // Лого = 20% от ширины фото
    const logoWidth = Math.round(width * 0.2);

    // 4. Композитинг (наложение)
    const processedBuffer = await sharp(inputBuffer)
      .composite([{
        input: logoPath,
        gravity: 'northeast', // Правый верхний угол
        blend: 'over',
        width: logoWidth, // Sharp сам масштабирует лого под ширину
        top: Math.round(imageMetadata.height * 0.05), // Отступ сверху 5%
        left: Math.round(width - logoWidth - (width * 0.05)) // Отступ справа 5%
      }])
      .png() // Конвертируем в PNG для качества
      .toBuffer();

    // Возвращаем как Base64
    return `data:image/png;base64,${processedBuffer.toString('base64')}`;

  } catch (error) {
    console.error("❌ Ошибка наложения логотипа:", error);
    return imageBase64OrUrl; // Если ошибка, возвращаем оригинал
  }
}