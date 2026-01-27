// C:\shikshop\src\app\admin\javo\utils.js

export const getImageUrl = (img) => {
  if (!img) return '/images/placeholder.jpg';
  return img.startsWith('http') ? img : `/api/images/${img}`;
};

// 👇 Функция сжатия картинки (Исправляет ошибку 413)
export const compressImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous"; // Важно для CORS
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800; // Сжимаем до 800px (этого достаточно для AI)
      
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Конвертируем в JPEG с качеством 70%
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      resolve(base64);
    };
    
    img.onerror = (err) => reject(err);
  });
};