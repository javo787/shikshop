// Добавьте эту функцию в TryOn/utils.js

export const compressBase64Image = (base64Str, maxWidth = 1280) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Если картинка больше макс ширины, уменьшаем
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Сжимаем в JPEG 0.85
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
    });
};