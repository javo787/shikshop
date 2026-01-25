// src/components/TryOn/utils.js

export const MAX_INPUT_SIZE_MB = 30;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export const COMPLIMENTS = [
  "Вау! Вы выглядите потрясающе! 😍",
  "Этот образ создан для вас! ✨",
  "Просто икона стиля! 💖",
  "Вам очень идет! 🔥",
  "10 из 10! Идеальное сочетание! 🌟"
];

// Обновляем чеклист для новой визуальной модалки (текст короче)
export const VALIDATION_CHECKLIST = [
  { id: 'light', label: 'Хороший свет', icon: '💡', desc: 'Лицо без теней' },
  { id: 'pose', label: 'Ровная поза', icon: '🧍‍♀️', desc: 'Руки не скрещены' },
  { id: 'clothes', label: 'Облегающее', icon: '👕', desc: 'Не оверсайз' },
];

export const LOADING_STEPS = [
  { text: "🔍 Сканируем фото...", emoji: "📸" },
  { text: "📐 Строим 3D-модель...", emoji: "👤" },
  { text: "✂️ Подгоняем одежду...", emoji: "👗" },
  { text: "🎨 Рендеринг (это может занять время)...", emoji: "⏳" },
  { text: "✨ Наводим красоту...", emoji: "✨" }
];

// --- Функции ---

export const analyzeImageQuality = (imgElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    let colorSum = 0;
    let count = 0;
    for (let x = 0, len = imageData.length; x < len; x += 40) {
      colorSum += Math.floor((imageData[x] + imageData[x + 1] + imageData[x + 2]) / 3);
      count++;
    }
    const brightness = Math.floor(colorSum / count);

    if (brightness < 50) return "⚠️ Слишком темно. Включите свет!";
    if (brightness > 230) return "⚠️ Слишком ярко (засвет).";
    return null;
};

export const compressBase64Image = (base64Str, maxWidth = 1280) => {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width *= maxWidth / height;
                    height = maxWidth;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.90)); // Чуть выше качество (0.9)
        };
        img.onerror = () => resolve(base64Str);
    });
};