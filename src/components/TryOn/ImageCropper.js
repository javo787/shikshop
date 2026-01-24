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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-fadeIn">
      {/* Исправили высоту и отступы контейнера */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-scaleIn">
        
        {/* Заголовок */}
        <div className="p-4 bg-white dark:bg-gray-900 z-10 border-b border-gray-100 dark:border-gray-800 text-center shrink-0">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">✂️ Кадрирование</h3>
          <p className="text-xs text-gray-500">Подгоните фото под формат 3:4</p>
        </div>
        
        {/* Область кроппера - ВАЖНО: добавили min-h-[50vh] */}
        <div className="relative w-full h-[50vh] bg-black shrink-0">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaChange}
            onZoomChange={onZoomChange}
            showGrid={true}
          />
        </div>

        {/* Управление */}
        <div className="p-5 flex flex-col gap-5 bg-white dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Зум</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
            />
          </div>
          
          <div className="flex gap-3">
            <button 
                onClick={onCancel} 
                className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
                Отмена
            </button>
            <button 
                onClick={createCroppedImage} 
                className="flex-1 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-pink-500/30 transition-transform active:scale-95"
            >
                Готово ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Утилита для обрезки ---
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

  return canvas.toDataURL('image/jpeg', 0.95);
}

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.setAttribute('crossOrigin', 'anonymous');
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });