// lib/image-processing.js
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export async function addBranding(imageBase64OrUrl) {
  try {
    // 1. Получаем буфер исходного изображения
    let inputBuffer;
    
    // Обработка URL (если пришло от Replicate)
    if (imageBase64OrUrl.startsWith('http')) {
        const response = await fetch(imageBase64OrUrl);
        const arrayBuffer = await response.arrayBuffer();
        inputBuffer = Buffer.from(arrayBuffer);
    } 
    // Обработка Base64 (если пришло от Google)
    else if (imageBase64OrUrl.startsWith('data:image')) {
        const base64Data = imageBase64OrUrl.replace(/^data:image\/\w+;base64,/, "");
        inputBuffer = Buffer.from(base64Data, 'base64');
    } else {
        // Если пришел "голый" base64 без префикса
        inputBuffer = Buffer.from(imageBase64OrUrl, 'base64');
    }

    // 2. Путь к логотипу
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    
    // Проверка существования файла
    try {
        await fs.access(logoPath);
    } catch {
        console.warn("⚠️ [Branding] Логотип не найден по пути:", logoPath);
        // Возвращаем оригинал, если лого нет
        return imageBase64OrUrl.startsWith('http') 
            ? `data:image/png;base64,${inputBuffer.toString('base64')}`
            : imageBase64OrUrl; 
    }

    // 3. Получаем размеры основного фото
    const mainImage = sharp(inputBuffer);
    const metadata = await mainImage.metadata();
    const width = metadata.width;

    // Рассчитываем размер лого (20% от ширины)
    const logoWidth = Math.round(width * 0.2);

    // 4. 🔥 ГЛАВНОЕ ИСПРАВЛЕНИЕ: Сначала ресайзим логотип!
    const resizedLogoBuffer = await sharp(logoPath)
        .resize({ width: logoWidth }) // Меняем размер тут
        .toBuffer();

    // 5. Накладываем
    const processedBuffer = await mainImage
      .composite([{
        input: resizedLogoBuffer, // Кладем уже уменьшенный логотип
        gravity: 'northeast',
        blend: 'over',
        top: Math.round(metadata.height * 0.05), // Отступ 5%
        left: Math.round(width - logoWidth - (width * 0.05)) // Отступ 5%
      }])
      .png()
      .toBuffer();

    // Возвращаем Base64
    return `data:image/png;base64,${processedBuffer.toString('base64')}`;

  } catch (error) {
    console.error("❌ [Branding Error]:", error);
    // Если произошла ошибка, возвращаем исходную картинку (конвертируя в base64 если был URL)
    return imageBase64OrUrl; 
  }
}