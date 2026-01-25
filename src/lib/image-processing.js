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
        console.log("⬇️ Скачиваем картинку для брендинга:", imageBase64OrUrl);
        const response = await fetch(imageBase64OrUrl);
        
        // 🔥 ВАЖНО: Проверяем, скачалась ли картинка
        if (!response.ok) {
            throw new Error(`Не удалось скачать картинку: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        inputBuffer = Buffer.from(arrayBuffer);
    } 
    // Обработка Base64 (если пришло от Google)
    else if (imageBase64OrUrl.startsWith('data:image')) {
        console.log("⬇️ Обрабатываем Base64 от Google");
        const base64Data = imageBase64OrUrl.replace(/^data:image\/\w+;base64,/, "");
        inputBuffer = Buffer.from(base64Data, 'base64');
    } else {
        inputBuffer = Buffer.from(imageBase64OrUrl, 'base64');
    }

    // 2. Путь к логотипу
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    console.log("📂 Ищем логотип здесь:", logoPath);
    
    // Проверка существования файла
    try {
        await fs.access(logoPath);
    } catch {
        console.warn("⚠️ [Branding] Логотип НЕ НАЙДЕН по пути:", logoPath);
        console.warn("💡 Совет: Проверьте, лежит ли файл 'logo.png' в папке 'public/images/'");
        // Возвращаем оригинал
        return formatOutput(inputBuffer, imageBase64OrUrl); 
    }

    // 3. Получаем размеры основного фото
    const mainImage = sharp(inputBuffer);
    const metadata = await mainImage.metadata();
    
    if (!metadata.width) throw new Error("Не удалось определить размер исходного фото");
    
    const width = metadata.width;

    // Рассчитываем размер лого (20% от ширины)
    const logoWidth = Math.round(width * 0.2);

    console.log(`🖼 Размеры: Фото ${width}px, Лого делаем ${logoWidth}px`);

    // 4. Сначала ресайзим логотип
    const resizedLogoBuffer = await sharp(logoPath)
        .resize({ width: logoWidth }) 
        .toBuffer();

    // 5. Накладываем
    const processedBuffer = await mainImage
      .composite([{
        input: resizedLogoBuffer,
        gravity: 'northeast',
        blend: 'over',
        top: Math.round(metadata.height * 0.05), // Отступ 5% сверху
        left: Math.round(width - logoWidth - (width * 0.05)) // Отступ 5% справа
      }])
      .png()
      .toBuffer();

    console.log("✅ Логотип успешно наложен!");
    return `data:image/png;base64,${processedBuffer.toString('base64')}`;

  } catch (error) {
    console.error("❌ [Branding Error] Ошибка наложения логотипа:", error.message);
    // Возвращаем оригинал, чтобы пользователь хоть что-то увидел
    return imageBase64OrUrl; 
  }
}

// Вспомогательная функция для возврата в правильном формате при ошибке
function formatOutput(buffer, original) {
    if (original.startsWith('http')) {
        // Если был URL, возвращаем Base64 из буфера, если он есть
        if (buffer) return `data:image/png;base64,${buffer.toString('base64')}`;
        return original;
    }
    return original;
}