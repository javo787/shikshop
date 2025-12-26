import { useState } from 'react';

function ImageUpload({ onUpload, multiple = false, label = "Загрузить фото" }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const urls = [];

    // ВАЖНО: Убедись, что в Cloudinary создан пресет 'shikshop_unsigned'
    const UPLOAD_PRESET = 'shikshop_unsigned'; 
    const CLOUD_NAME = 'dprydst2c'; // Твой Cloud Name из кода

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки в Cloudinary');

        const data = await response.json();
        console.log('Загружено:', data.secure_url);
        urls.push(data.secure_url);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Не удалось загрузить фото. Проверьте консоль.');
      }
    }

    if (urls.length > 0) {
      if (multiple) {
        onUpload(urls); 
      } else {
        onUpload(urls[0]); 
      }
    }

    setUploading(false);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <label className="cursor-pointer bg-neutral-gray text-text-dark px-4 py-2 rounded border hover:bg-gray-300 transition text-sm">
        {uploading ? '⏳ Загрузка...' : label}
        <input 
          type="file" 
          accept="image/*" 
          multiple={multiple} 
          onChange={handleUpload} 
          className="hidden" 
          disabled={uploading}
        />
      </label>
      {uploading && <p className="text-xs text-gray-500">Пожалуйста, подождите...</p>}
    </div>
  );
}

export default ImageUpload;