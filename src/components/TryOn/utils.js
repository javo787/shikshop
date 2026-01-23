// src/components/TryOn/utils.js
const LOGO_PATH = '/images/logo.png';

export const MAX_INPUT_SIZE_MB = 30;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export const COMPLIMENTS = [
  "Вау! Вы выглядите потрясающе! 😍",
  "Этот образ создан для вас! ✨",
  "Просто икона стиля! 💖",
  "Вам очень идет! 🔥",
  "10 из 10! Идеальное сочетание! 🌟"
];

export const VALIDATION_CHECKLIST = [
  { id: 'light', label: 'Свет яркий, лицо и тело четко видно, без резких теней.' },
  { id: 'pose', label: 'Я стою ровно, смотрю прямо, руки немного в стороны.' },
  { id: 'clothes', label: 'На мне облегающая одежда (не оверсайз, не пуховик).' },
];

export const LOADING_STEPS = [
  { text: "🔍 Сканируем ваше фото...", emoji: "📸" },
  { text: "📐 Строим 3D-модель фигуры...", emoji: "👤" },
  { text: "✂️ Подгоняем лекала одежды...", emoji: "👗" },
  { text: "🧵 Виртуальный пошив...", emoji: "🪡" },
  { text: "🎨 Накладываем текстуры ткани...", emoji: "🧶" },
  { text: "💡 Выставляем студийный свет...", emoji: "💡" },
  { text: "🖌️ Прорисовываем складки и тени...", emoji: "🖊️" },
  { text: "✨ Добавляем реалистичность...", emoji: "✨" },
  { text: "🚀 Почти готово, загружаем...", emoji: "🚀" }
];

// Анализ качества фото
export const analyzeImageQuality = (imgElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    let colorSum = 0;
    for (let x = 0, len = imageData.length; x < len; x += 40) {
      colorSum += Math.floor((imageData[x] + imageData[x + 1] + imageData[x + 2]) / 3);
    }
    const brightness = Math.floor(colorSum / (imageData.length / 40));

    if (brightness < 50) return "⚠️ Очень темное фото. Результат будет плохим.";
    if (brightness > 230) return "⚠️ Фото засвечено. Детали могут пропасть.";
    return null;
};

// Сжатие изображения
export const compressAndAnalyzeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const warning = analyzeImageQuality(img);
          
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1280; 
          let width = img.width; let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }} 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }}
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve({ compressed: canvas.toDataURL('image/jpeg', 0.8), warning });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
};

// Нанесение логотипа
export const applyBranding = async (imageUrl) => {
    return new Promise((resolve) => {
        const img = new window.Image(); img.crossOrigin = "Anonymous"; img.src = imageUrl;
        img.onload = () => {
          const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
          canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0);
          const logo = new window.Image(); logo.src = LOGO_PATH;
          logo.onload = () => {
            const logoWidth = canvas.width * 0.20; const logoHeight = logo.height * (logoWidth / logo.width);
            ctx.globalAlpha = 0.9; ctx.drawImage(logo, canvas.width - logoWidth - (canvas.width * 0.05), (canvas.width * 0.05), logoWidth, logoHeight);
            resolve(canvas.toDataURL('image/png'));
          };
          logo.onerror = () => resolve(imageUrl);
        };
        img.onerror = () => resolve(imageUrl);
      });
};
