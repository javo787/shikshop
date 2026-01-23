'use client';
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);

  const onCropAreaChange = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl overflow-hidden flex flex-col h-[80vh]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 text-center">
          <h3 className="font-bold text-lg">Подгоните фото под формат 3:4</h3>
        </div>
        
        <div className="relative flex-1 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4} // 🔥 ЖЕСТКО ЗАДАЕМ 3:4
            onCropChange={onCropChange}
            onCropComplete={onCropAreaChange}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold">Зум:</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-full accent-pink-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-gray-600 hover:bg-gray-200">Отмена</button>
            <button onClick={createCroppedImage} className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 shadow-lg">Готово ✓</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Утилита для обрезки (добавьте это в тот же файл или в utils.js) ---
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });